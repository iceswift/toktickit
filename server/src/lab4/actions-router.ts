import { createHash } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { Prisma, type ActionTaken } from '@prisma/client';
import { currentUser } from '../auth.js';
import { getPrisma } from '../prisma.js';
import { ActionFailure, badInput, parseActionInput, permittedActionTransition } from './action-validation.js';
import { createActionWithHistory, updateActionWithHistory, MutationConflict } from './versioned-mutations.js';
import { allowedTicketTransitions } from './ticket-workflow.js';

export const actionsRouter = Router();
const person = { id:true, name:true } as const;
const actionSelect = { id:true,ticketId:true,actionDateTime:true,description:true,result:true,followUpRequired:true,
  followUpNote:true,attachmentNotes:true,status:true,version:true,createdAt:true,updatedAt:true,
  performedBy:{select:person},assignee:{select:{...person,isActive:true}} } satisfies Prisma.ActionTakenSelect;
const fail = (status:number,code:string):never=>{throw new ActionFailure(status,code);};
function id(value:string|undefined) { if(!value || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) return fail(404,'NOT_FOUND');return Number(value); }
async function user(req:Request,tx:Prisma.TransactionClient,staff:boolean) {
  const value=await currentUser(req,tx);if(!value)return fail(401,'AUTHENTICATION_REQUIRED');
  if(value.mustChangePassword || (staff ? !['IT_STAFF','ADMINISTRATOR'].includes(value.role) : value.role!=='REQUESTER')) return fail(403,'FORBIDDEN');
  return value;
}
async function accessible(req:Request,tx:Prisma.TransactionClient,staff:boolean) {
  const actor=await user(req,tx,staff);
  const ticket=await tx.ticket.findFirst({where:{id:id(req.params.ticketId),...(!staff?{requesterUserId:actor.id}:{})}});
  if(!ticket)return fail(404,'NOT_FOUND');return {actor,ticket};
}
export function actionError(res:Response,error:unknown) {
  if(error instanceof ActionFailure)return res.status(error.status).json({error:'Unable to complete this Action request.',code:error.code,...(Object.keys(error.fields).length?{fields:error.fields}:{})});
  if(error instanceof MutationConflict)return res.status(error.code==='INVALID_MUTATION'?400:409).json({error:'Refresh the Ticket and try again.',code:error.code});
  return res.status(500).json({error:'Unable to complete this Action request.'});
}
type Handler=(req:Request,res:Response)=>Promise<unknown>;
const safe=(handler:Handler)=>(req:Request,res:Response)=>{void handler(req,res).catch(error=>actionError(res,error));};
function paging(req:Request,own=false) {
  if(Object.keys(req.query).some(key=>!['page','pageSize',...(own?['performedBy']:[])].includes(key)))return badInput('query');
  const parse=(value:unknown,fallback:number)=>value===undefined?fallback:typeof value==='string'&&/^[1-9]\d*$/.test(value)?Number(value):NaN;
  const page=parse(req.query.page,1),pageSize=parse(req.query.pageSize,10);
  if(!Number.isSafeInteger(page)||![10,20,50].includes(pageSize)||!Number.isSafeInteger((page-1)*pageSize))return badInput('query');
  return {page,pageSize};
}
async function validData(tx:Prisma.TransactionClient,ticket:{createdAt:Date},data:Pick<ActionTaken,'actionDateTime'|'description'|'result'|'followUpRequired'|'followUpNote'|'assigneeUserId'|'status'>) {
  if(data.actionDateTime<ticket.createdAt || data.actionDateTime>new Date())return badInput('actionDateTime');
  if(data.followUpRequired&&!data.followUpNote.trim())return badInput('followUpNote');
  if(data.status==='COMPLETED'&&!data.result.trim())return badInput('result');
  const assignee=await tx.user.findFirst({where:{id:data.assigneeUserId,isActive:true,role:{in:['IT_STAFF','ADMINISTRATOR']}},select:{id:true}});
  if(!assignee)return badInput('assigneeUserId');
}
function active(status:string){if(['RESOLVED','CLOSED','CANCELLED'].includes(status))fail(409,'TERMINAL_TICKET');}

for(const [prefix,staff] of [['/api/tickets',false],['/staff/tickets',true]] as const) {
  const root=`${prefix}/:ticketId`;
  actionsRouter.get(root+'/actions',safe(async(req,res)=>{
    const {page,pageSize}=paging(req);
    const result=await getPrisma().$transaction(async tx=>{
      const {ticket}=await accessible(req,tx,staff);
      const where={ticketId:ticket.id};
      const [items,totalItems]=await Promise.all([tx.actionTaken.findMany({where,select:actionSelect,orderBy:[{actionDateTime:'asc'},{id:'asc'}],skip:(page-1)*pageSize,take:pageSize}),tx.actionTaken.count({where})]);
      return {items,page,pageSize,totalItems,totalPages:Math.max(1,Math.ceil(totalItems/pageSize))};
    },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});
    return res.json(result);
  }));
  actionsRouter.get(root+'/actions/:actionId/events',safe(async(req,res)=>{
    const result=await getPrisma().$transaction(async tx=>{
      const {ticket}=await accessible(req,tx,staff);
      const action=await tx.actionTaken.findFirst({where:{id:id(req.params.actionId),ticketId:ticket.id},select:{id:true}});if(!action)return fail(404,'NOT_FOUND');
      return {items:await tx.actionEvent.findMany({where:{actionId:action.id,ticketId:ticket.id},select:{id:true,type:true,actor:{select:person},createdAt:true,version:true,changes:true},orderBy:[{createdAt:'asc'},{id:'asc'}]})};
    });return res.json(result);
  }));
  actionsRouter.get(root+'/workflow-events',safe(async(req,res)=>{
    const result=await getPrisma().$transaction(async tx=>{
      const {ticket}=await accessible(req,tx,staff);
      const actions=await tx.actionTaken.findMany({where:{ticketId:ticket.id},select:{status:true,followUpRequired:true}});
      const reasons=[...(!actions.some(a=>a.status==='COMPLETED')?['NO_COMPLETED_ACTION']:[]),...(actions.some(a=>['PLANNED','IN_PROGRESS'].includes(a.status))?['OPEN_ACTIONS']:[]),...(actions.some(a=>a.status!=='CANCELLED'&&a.followUpRequired)?['FOLLOW_UP_PENDING']:[])];
      return {items:await tx.ticketWorkflowEvent.findMany({where:{ticketId:ticket.id},select:{id:true,actor:{select:person},createdAt:true,version:true,fromStatus:true,toStatus:true},orderBy:[{createdAt:'asc'},{id:'asc'}]}),
        ticket:{id:ticket.id,currentStatus:ticket.currentStatus,version:ticket.version,lastResolvedAt:ticket.lastResolvedAt},
        eligibility:{allowedTransitions:allowedTicketTransitions[ticket.currentStatus],resolutionReasons:reasons,cancelBlocked:actions.some(a=>['PLANNED','IN_PROGRESS'].includes(a.status))}};
    },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});return res.json(result);
  }));
}
// Express4 uses explicit root/parameter patterns, not Express5 brace wildcards.
actionsRouter.all(['/api/tickets/:ticketId/actions','/api/tickets/:ticketId/actions/:actionId','/api/tickets/:ticketId/actions/:actionId/*'],(_req,res)=>res.status(403).json({error:'Requester Action history is read-only.'}));

actionsRouter.get('/staff/actions',safe(async(req,res)=>{
  const {page,pageSize}=paging(req,true);if(req.query.performedBy!=='me')return badInput('performedBy');
  const result=await getPrisma().$transaction(async tx=>{
    const actor=await user(req,tx,true);const where={performedByUserId:actor.id};
    const [items,totalItems]=await Promise.all([tx.actionTaken.findMany({where,select:{...actionSelect,ticket:{select:{id:true,ticketNumber:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}],skip:(page-1)*pageSize,take:pageSize}),tx.actionTaken.count({where})]);
    return {items,page,pageSize,totalItems,totalPages:Math.max(1,Math.ceil(totalItems/pageSize))};
  },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});return res.json(result);
}));
actionsRouter.post('/staff/tickets/:ticketId/actions',safe(async(req,res)=>{
  const parsed=parseActionInput('create',req.body);const key=req.get('Idempotency-Key');
  if(!key||!/^[A-Za-z0-9_-]{8,128}$/.test(key))return badInput('Idempotency-Key');
  const data=parsed.data as Parameters<typeof createActionWithHistory>[1]['data'];
  const payloadHash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
  const result=await getPrisma().$transaction(async tx=>{
    const {actor,ticket}=await accessible(req,tx,true);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${actor.id}:${ticket.id}:CREATE_ACTION:${key}`}))`;
    const existing=await tx.idempotencyRecord.findUnique({where:{userId_ticketId_operation_key:{userId:actor.id,ticketId:ticket.id,operation:'CREATE_ACTION',key}}});
    if(existing){
      if(existing.payloadHash!==payloadHash)return fail(409,'IDEMPOTENCY_CONFLICT');
      await accessible(req,tx,true); // recheck session/access on replay, even when versions are stale
      return {action:await tx.actionTaken.findFirstOrThrow({where:{id:existing.actionId,ticketId:ticket.id},select:actionSelect}),ticketVersion:(await tx.ticket.findUniqueOrThrow({where:{id:ticket.id}})).version,replayed:true};
    }
    const action=await createActionWithHistory(tx,{ticketId:ticket.id,actorId:actor.id,expectedTicketVersion:parsed.expectedTicketVersion,data},async(policyTx)=>{
      const current=await accessible(req,policyTx,true);active(current.ticket.currentStatus);
      await validData(policyTx,current.ticket,{...data,status:'PLANNED'});
    });
    await tx.idempotencyRecord.create({data:{userId:actor.id,ticketId:ticket.id,key,payloadHash,actionId:action.id}});
    return {action:await tx.actionTaken.findUniqueOrThrow({where:{id:action.id},select:actionSelect}),ticketVersion:parsed.expectedTicketVersion+1,replayed:false};
  });return res.status(result.replayed?200:201).json(result);
}));
for(const [suffix,mode] of [['','edit'],['/assignee','assign'],['/status','status']] as const){
  actionsRouter.patch('/staff/tickets/:ticketId/actions/:actionId'+suffix,safe(async(req,res)=>{
    const parsed=parseActionInput(mode,req.body);
    const result=await getPrisma().$transaction(async tx=>{
      const {actor,ticket}=await accessible(req,tx,true);const actionId=id(req.params.actionId);
      if(!await tx.actionTaken.findFirst({where:{id:actionId,ticketId:ticket.id},select:{id:true}}))return fail(404,'NOT_FOUND');
      const updated=await updateActionWithHistory(tx,{ticketId:ticket.id,actorId:actor.id,actionId,expectedVersion:parsed.expectedVersion!,expectedTicketVersion:parsed.expectedTicketVersion,data:parsed.data},async(policyTx)=>{
        const current=await accessible(req,policyTx,true);active(current.ticket.currentStatus);
        const before=await policyTx.actionTaken.findFirstOrThrow({where:{id:actionId,ticketId:ticket.id}});
        if(before.version!==parsed.expectedVersion)throw new MutationConflict('STALE_VERSION');
        if(mode==='status'&&!permittedActionTransition(before.status,parsed.data.status!))return fail(409,'INVALID_ACTION_TRANSITION');
        await validData(policyTx,current.ticket,{...before,...parsed.data});
      });
      return {action:await tx.actionTaken.findUniqueOrThrow({where:{id:updated.id},select:actionSelect}),ticketVersion:parsed.expectedTicketVersion+1};
    });return res.json(result);
  }));
}
