import type { Request } from 'express';
import { Prisma, TicketStatus } from '@prisma/client';
import { getPrisma } from '../prisma.js';
import { currentUser } from '../auth.js';
import { ActionFailure, positive } from './action-validation.js';
import { MutationConflict, transitionTicketWithHistory } from './versioned-mutations.js';
import { resolutionReason } from './ticket-workflow.js';

/** Existing status endpoint, now final Lab4 roles, strict preconditions and gate.
 * All policy and history persist under the same shared parent lock as Actions. */
export async function legacyStatusWithHistory(req:Request,ticketId:number,status:TicketStatus,
  transitions:Record<string,string[]>,include:Prisma.TicketInclude) {
  return getPrisma().$transaction(async tx=>{
    const ticket=await tx.ticket.findUnique({where:{id:ticketId}});
    if(!ticket)throw new ActionFailure(404,'NOT_FOUND');
    const user=await currentUser(req,tx);
    if(!user)throw new ActionFailure(401,'AUTHENTICATION_REQUIRED');
    if(!['IT_STAFF','ADMINISTRATOR'].includes(user.role)||user.mustChangePassword)throw new ActionFailure(403,'FORBIDDEN');
    if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.body).some(key=>!['status','expectedVersion'].includes(key)))throw new ActionFailure(400,'VALIDATION_ERROR',{body:'Unknown or immutable fields are not accepted.'});
    const supplied=req.body?.expectedVersion;
    if(supplied===undefined)throw new MutationConflict('STALE_VERSION');
    const expectedTicketVersion=positive(supplied,'expectedVersion');
    // Also maps identity transitions to the contracted409, not primitive400.
    if(!transitions[ticket.currentStatus]?.includes(status))throw new ActionFailure(409,'INVALID_STATUS_TRANSITION');
    await transitionTicketWithHistory(tx,{ticketId,actorId:user.id,expectedTicketVersion,toStatus:status},async(policyTx)=>{
      const actor=await currentUser(req,policyTx);
      if(!actor)throw new ActionFailure(401,'AUTHENTICATION_REQUIRED');
      if(!['IT_STAFF','ADMINISTRATOR'].includes(actor.role)||actor.mustChangePassword)throw new ActionFailure(403,'FORBIDDEN');
      const current=await policyTx.ticket.findUniqueOrThrow({where:{id:ticketId}});
      if(!transitions[current.currentStatus]?.includes(status))throw new ActionFailure(409,'INVALID_STATUS_TRANSITION');
      const actions=await policyTx.actionTaken.findMany({where:{ticketId},select:{status:true,followUpRequired:true}});
      const open=actions.some(action=>action.status==='PLANNED'||action.status==='IN_PROGRESS');
      if(status==='CANCELLED'&&open)throw new ActionFailure(409,'OPEN_ACTIONS');
      if(status==='RESOLVED'){
        const reason=resolutionReason(actions);if(reason)throw new ActionFailure(409,'RESOLUTION_GATE',{reason});
      }
    });
    return tx.ticket.findUniqueOrThrow({where:{id:ticketId},include});
  });
}
