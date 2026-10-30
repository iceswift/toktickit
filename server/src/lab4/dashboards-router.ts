import { Router } from 'express';
import { Prisma, TicketStatus, ITPriority } from '@prisma/client';
import { getPrisma } from '../prisma.js';
import { currentUser } from '../auth.js';
import { ActionFailure } from './action-validation.js';
import { actionError } from './actions-router.js';
import { openStatuses,resolvedWindow } from './dashboard-policy.js';
export const dashboardsRouter=Router();
const summary={id:true,ticketNumber:true,summary:true,currentStatus:true,itPriority:true,updatedAt:true} as const;
const recent=[{updatedAt:'desc'},{id:'desc'}] as Prisma.TicketOrderByWithRelationInput[];
for(const [path,requester] of [['/api/tickets/dashboard',true],['/staff/dashboard',false]] as const){
  dashboardsRouter.get(path,(req,res)=>{void Promise.resolve().then(()=>getPrisma().$transaction(async tx=>{
    const user=await currentUser(req,tx);if(!user)throw new ActionFailure(401,'AUTHENTICATION_REQUIRED');
    if(user.mustChangePassword||(requester?user.role!=='REQUESTER':!['IT_STAFF','ADMINISTRATOR'].includes(user.role)))throw new ActionFailure(403,'FORBIDDEN');
    if(Object.keys(req.query).length)throw new ActionFailure(400,'VALIDATION_ERROR');
    const asOf=new Date();const window=resolvedWindow(asOf);const own:Prisma.TicketWhereInput=requester?{requesterUserId:user.id}:{};
    const open:Prisma.TicketWhereInput={...own,currentStatus:{in:openStatuses}};
    const recentTickets=await tx.ticket.findMany({where:own,select:summary,orderBy:recent,take:5});
    if(requester){
      const waiting={...own,currentStatus:'WAITING_FOR_REQUESTER' as const},resolved={...own,currentStatus:{in:['RESOLVED','CLOSED'] as TicketStatus[]},lastResolvedAt:{gte:new Date(window.start),lt:asOf}};
      const [openTickets,waitingTickets,recentlyResolvedTickets,attentionTickets]=await Promise.all([tx.ticket.count({where:open}),tx.ticket.count({where:waiting}),tx.ticket.count({where:resolved}),tx.ticket.findMany({where:waiting,select:summary,orderBy:recent,take:5})]);
      const resolvedQuery=new URLSearchParams({statusGroup:'resolved',resolvedSince:window.start,resolvedBefore:window.end});
      return {asOf:asOf.toISOString(),timeZone:'Asia/Bangkok',resolvedWindow:window,metrics:{openTickets,waitingTickets,recentlyResolvedTickets},recentTickets,attentionTickets,
        drillDown:{openTickets:'/api/tickets?statusGroup=open',waitingTickets:'/api/tickets?status=WAITING_FOR_REQUESTER',recentlyResolvedTickets:`/api/tickets?${resolvedQuery}`}};
    }
    const [unassignedOpenTickets,myOpenTickets,statusGroups,priorityGroups,myActions,recentMyActions,urgent,high]=await Promise.all([
      tx.ticket.count({where:{...open,ownerUserId:null}}),tx.ticket.count({where:{...open,ownerUserId:user.id}}),
      tx.ticket.groupBy({by:['currentStatus'],_count:{_all:true}}),tx.ticket.groupBy({by:['itPriority'],where:open,_count:{_all:true}}),
      tx.actionTaken.count({where:{performedByUserId:user.id}}),tx.actionTaken.findMany({where:{performedByUserId:user.id},orderBy:[{createdAt:'desc'},{id:'desc'}],take:5,select:{id:true,description:true,status:true,createdAt:true,ticket:{select:{id:true,ticketNumber:true}}}}),
      tx.ticket.findMany({where:{...open,itPriority:'URGENT'},select:summary,orderBy:recent,take:5}),tx.ticket.findMany({where:{...open,itPriority:'HIGH'},select:summary,orderBy:recent,take:5})]);
    const ticketsByStatus=Object.fromEntries(Object.values(TicketStatus).map(s=>[s,statusGroups.find(g=>g.currentStatus===s)?._count._all??0]));
    const openTicketsByPriority=Object.fromEntries(Object.values(ITPriority).map(p=>[p,priorityGroups.find(g=>g.itPriority===p)?._count._all??0]));
    return {asOf:asOf.toISOString(),timeZone:'Asia/Bangkok',metrics:{unassignedOpenTickets,myOpenTickets,ticketsByStatus,openTicketsByPriority,myActions},recentTickets,urgentTickets:[...urgent,...high].slice(0,5),recentMyActions:recentMyActions.map(a=>({...a,description:a.description.length>160?a.description.slice(0,157)+'...':a.description})),
      drillDown:{unassignedOpenTickets:'/staff/tickets?statusGroup=open&unassigned=true',myOpenTickets:`/staff/tickets?statusGroup=open&ownerId=${user.id}`,myActions:'/staff/actions?performedBy=me',
        ticketsByStatus:Object.fromEntries(Object.values(TicketStatus).map(s=>[s,`/staff/tickets?status=${s}`])),openTicketsByPriority:Object.fromEntries(Object.values(ITPriority).map(p=>[p,`/staff/tickets?statusGroup=open&priority=${p}`]))}};
  },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead})).then(value=>res.json(value)).catch(error=>actionError(res,error));});
}
