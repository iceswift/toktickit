/** The approved Lab4 matrix. Assignment, comments and Action states are separate. */
export const allowedTicketTransitions:Record<string,string[]>={
  NEW:['OPEN','IN_PROGRESS','CANCELLED'],
  OPEN:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],
  REOPENED:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],
  IN_PROGRESS:['WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],
  WAITING_FOR_REQUESTER:['IN_PROGRESS','RESOLVED','CANCELLED'],
  RESOLVED:['CLOSED','REOPENED'],CLOSED:['REOPENED'],CANCELLED:[],
};
export function resolutionReason(actions:ReadonlyArray<{status:string;followUpRequired:boolean}>){
  if(!actions.some(a=>a.status==='COMPLETED'))return 'NO_COMPLETED_ACTION';
  if(actions.some(a=>a.status==='PLANNED'||a.status==='IN_PROGRESS'))return 'OPEN_ACTIONS';
  if(actions.some(a=>a.status!=='CANCELLED'&&a.followUpRequired))return 'FOLLOW_UP_PENDING';
  return null;
}
