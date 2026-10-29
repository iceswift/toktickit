import type { Request } from 'express';
import { Prisma, TicketStatus } from '@prisma/client';
import { getPrisma } from '../prisma.js';
import { currentUser } from '../auth.js';
import { ActionFailure, positive } from './action-validation.js';
import { MutationConflict, transitionTicketWithHistory } from './versioned-mutations.js';

/** Security prerequisite for enabling Action writes: the old status writer
 * cannot remain an unversioned bypass. Staff-only baseline role is preserved;
 * the final Admin/UI contract integration still belongs to the workflow phase.
 */
export async function legacyStatusWithHistory(req:Request,ticketId:number,status:TicketStatus,
  transitions:Record<string,string[]>,include:Prisma.TicketInclude) {
  return getPrisma().$transaction(async tx=>{
    const ticket=await tx.ticket.findUnique({where:{id:ticketId}});
    if(!ticket)throw new ActionFailure(404,'NOT_FOUND');
    const user=await currentUser(req,tx);
    if(!user)throw new ActionFailure(401,'AUTHENTICATION_REQUIRED');
    if(user.role!=='IT_STAFF'||user.mustChangePassword)throw new ActionFailure(403,'FORBIDDEN');
    const supplied=req.body?.expectedVersion;
    // Transitional compatibility ONLY for untouched legacy Tickets with no work
    // or workflow history. Once opted into Lab4, missing preconditions conflict.
    if(supplied===undefined && (await tx.actionTaken.count({where:{ticketId}})>0
      || await tx.ticketWorkflowEvent.count({where:{ticketId}})>0))throw new MutationConflict('STALE_VERSION');
    const expectedTicketVersion=supplied===undefined?ticket.version:positive(supplied,'expectedVersion');
    await transitionTicketWithHistory(tx,{ticketId,actorId:user.id,expectedTicketVersion,toStatus:status},async(policyTx)=>{
      const actor=await currentUser(req,policyTx);
      if(!actor)throw new ActionFailure(401,'AUTHENTICATION_REQUIRED');
      if(actor.role!=='IT_STAFF'||actor.mustChangePassword)throw new ActionFailure(403,'FORBIDDEN');
      const current=await policyTx.ticket.findUniqueOrThrow({where:{id:ticketId}});
      if(!transitions[current.currentStatus]?.includes(status))throw new ActionFailure(409,'INVALID_STATUS_TRANSITION');
      const actions=await policyTx.actionTaken.findMany({where:{ticketId},select:{status:true,followUpRequired:true}});
      const open=actions.some(action=>action.status==='PLANNED'||action.status==='IN_PROGRESS');
      if(status==='CANCELLED'&&open)throw new ActionFailure(409,'OPEN_ACTIONS');
      if(status==='RESOLVED'){
        if(!actions.some(action=>action.status==='COMPLETED'))throw new ActionFailure(409,'RESOLUTION_GATE',{reason:'NO_COMPLETED_ACTION'});
        if(open)throw new ActionFailure(409,'RESOLUTION_GATE',{reason:'OPEN_ACTIONS'});
        if(actions.some(action=>action.status!=='CANCELLED'&&action.followUpRequired))throw new ActionFailure(409,'RESOLUTION_GATE',{reason:'FOLLOW_UP_PENDING'});
      }
    });
    return tx.ticket.findUniqueOrThrow({where:{id:ticketId},include});
  });
}
