import { API_URL, type TicketStatus, type StaffTicketDetail } from './api.js';
export interface WorkflowState {
  ticket:{id:number;currentStatus:TicketStatus;version:number;lastResolvedAt:string|null};
  eligibility:{allowedTransitions:TicketStatus[];resolutionReasons:string[];cancelBlocked:boolean};
  items:{id:number;actor:{id:number;name:string};createdAt:string;version:number;fromStatus:TicketStatus;toStatus:TicketStatus}[];
}
const statuses=['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED'];
const positive=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>0;
export class WorkflowError extends Error {
  constructor(public status:number,public code:string,public reason=''){
    super(status===401?'Your session has expired. Sign in again.':status===403?'You do not have permission to access this Ticket workflow.':status===404?'Ticket workflow is unavailable or not owned by you.':'Unable to load or save the Ticket workflow. Your selection is retained.');
  }
}
async function request<T>(path:string,body?:unknown):Promise<T>{
  let response:Response;try{response=await fetch(API_URL+path,{credentials:'include',...(body?{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});}catch{throw new WorkflowError(0,'NETWORK_ERROR');}
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw new WorkflowError(response.status,typeof data?.code==='string'?data.code:'FAILED',typeof data?.fields?.reason==='string'?data.fields.reason:'');
  if(!data||typeof data!=='object')throw new WorkflowError(0,'INVALID_RESPONSE');return data;
}
export async function getWorkflow(id:number,readOnly:boolean){
  const data=await request<WorkflowState>(`${readOnly?'/api':'/staff'}/tickets/${id}/workflow-events`);
  if(data.ticket?.id!==id||!positive(data.ticket?.version)||!statuses.includes(data.ticket.currentStatus)||
    !Array.isArray(data.eligibility?.allowedTransitions)||!data.eligibility.allowedTransitions.every(s=>statuses.includes(s))||
    !Array.isArray(data.eligibility.resolutionReasons)||!data.eligibility.resolutionReasons.every(r=>['NO_COMPLETED_ACTION','OPEN_ACTIONS','FOLLOW_UP_PENDING'].includes(r))||typeof data.eligibility.cancelBlocked!=='boolean'||
    !Array.isArray(data.items)||!data.items.every(e=>e&&positive(e.id)&&positive(e.version)&&positive(e.actor?.id)&&typeof e.actor.name==='string'&&statuses.includes(e.fromStatus)&&statuses.includes(e.toStatus)&&Number.isFinite(Date.parse(e.createdAt))))throw new WorkflowError(0,'INVALID_RESPONSE');
  return data;
}
export async function changeWorkflow(id:number,status:TicketStatus,expectedVersion:number){
  const data=await request<StaffTicketDetail>(`/staff/tickets/${id}/status`,{status,expectedVersion});
  if(data.id!==id||!positive(data.version)||!statuses.includes(data.currentStatus))throw new WorkflowError(0,'INVALID_RESPONSE');return data;
}
