import { describe, expect, it } from 'vitest';
import { allowedTicketTransitions, resolutionReason } from '../../src/lab4/ticket-workflow.js';
const expected:Record<string,string[]>={NEW:['OPEN','IN_PROGRESS','CANCELLED'],OPEN:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],IN_PROGRESS:['WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],WAITING_FOR_REQUESTER:['IN_PROGRESS','RESOLVED','CANCELLED'],RESOLVED:['CLOSED','REOPENED'],CLOSED:['REOPENED'],REOPENED:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],CANCELLED:[]};
describe('Approved Ticket matrix and resolution predicate',()=>{
  for(const from of Object.keys(expected))for(const to of Object.keys(expected))it(`${from} -> ${to}: ${expected[from].includes(to)?'allowed':'rejected'}`,()=>{
    expect(allowedTicketTransitions[from].includes(to)).toBe(expected[from].includes(to));
  });
  it('requires completed work, excludes cancelled work, rejects open/follow-up and accepts cleared completed work',()=>{
    expect(resolutionReason([])).toBe('NO_COMPLETED_ACTION');
    expect(resolutionReason([{status:'CANCELLED',followUpRequired:false}])).toBe('NO_COMPLETED_ACTION');
    expect(resolutionReason([{status:'COMPLETED',followUpRequired:false},{status:'PLANNED',followUpRequired:false}])).toBe('OPEN_ACTIONS');
    expect(resolutionReason([{status:'COMPLETED',followUpRequired:true}])).toBe('FOLLOW_UP_PENDING');
    expect(resolutionReason([{status:'COMPLETED',followUpRequired:false},{status:'CANCELLED',followUpRequired:true}])).toBeNull();
  });
});
