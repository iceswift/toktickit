import { API_URL, ApiError, getStaffTicketDetail, getStaffTicketOwners, type TicketStatus } from './api.js';

export type ActionStatus='PLANNED'|'IN_PROGRESS'|'COMPLETED'|'CANCELLED';
export interface Action {
  id:number;ticketId:number;performedBy:{id:number;name:string};assignee:{id:number;name:string;isActive:boolean};
  actionDateTime:string;description:string;result:string;followUpRequired:boolean;followUpNote:string;
  attachmentNotes:string;status:ActionStatus;version:number;createdAt:string;updatedAt:string;
}
export interface ActionPage {items:Action[];page:number;pageSize:number;totalItems:number;totalPages:number}
export interface ActionEvent {id:number;type:string;actor:{id:number;name:string};createdAt:string;version:number;changes:Record<string,unknown>}
export interface ActionFields {actionDateTime:string;description:string;result:string;assigneeUserId:number;followUpRequired:boolean;followUpNote:string;attachmentNotes:string}
export interface ActionSnapshot {id:number;version:number;createdAt:string;currentStatus:TicketStatus}
export interface SavedAction {action:Action;ticketVersion:number;replayed?:boolean}
export class ActionRequestError extends ApiError {
  constructor(public readonly status:number,public readonly code:string,fields:Record<string,string>={}) {
    super(status===401?'Your session has expired. Please sign in again.':status===403?'You do not have permission to access these Actions.':status===404?'Actions are unavailable or you do not have access to this Ticket.':status===409?'The saved Ticket or Action changed. Refresh and reconcile your draft.':'Unable to save or load Actions. Please try again.',fields);
  }
}
async function request<T>(path:string,method='GET',body?:unknown,key?:string):Promise<T>{
  let response:Response;
  try{response=await fetch(`${API_URL}${path}`,{method,credentials:'include',headers:{...(body!==undefined?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
  catch{throw new ActionRequestError(0,'NETWORK_ERROR');}
  const data=await response.json().catch(()=>null) as T&{code?:string;fields?:Record<string,string>};
  if(!response.ok)throw new ActionRequestError(response.status,typeof data?.code==='string'?data.code:'REQUEST_FAILED',data?.fields??{});
  if(!data||typeof data!=='object')throw new ActionRequestError(0,'INVALID_RESPONSE');
  return data;
}
const root=(ticketId:number,readOnly:boolean)=>`${readOnly?'/api':'/staff'}/tickets/${ticketId}/actions`;
const positive=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>0;
function validAction(value:Action){
  return value&&positive(value.id)&&positive(value.ticketId)&&positive(value.version)&&
    positive(value.performedBy?.id)&&typeof value.performedBy.name==='string'&&positive(value.assignee?.id)&&
    typeof value.assignee.name==='string'&&typeof value.assignee.isActive==='boolean'&&typeof value.followUpRequired==='boolean'&&
    ['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'].includes(value.status)&&
    ['description','result','followUpNote','attachmentNotes'].every(key=>typeof value[key as keyof Action]==='string')&&
    [value.actionDateTime,value.createdAt,value.updatedAt].every(date=>typeof date==='string'&&Number.isFinite(Date.parse(date)));
}
export async function getActions(ticketId:number,readOnly:boolean,page=1,pageSize=10):Promise<ActionPage>{
  const data=await request<ActionPage>(`${root(ticketId,readOnly)}?page=${page}&pageSize=${pageSize}`);
  if(!Array.isArray(data.items)||!data.items.every(validAction)||!positive(data.page)||!positive(data.totalPages)||
      ![10,20,50].includes(data.pageSize)||!Number.isSafeInteger(data.totalItems)||data.totalItems<0)throw new ActionRequestError(0,'INVALID_RESPONSE');
  return data;
}
export async function getActionEvents(ticketId:number,actionId:number,readOnly:boolean){
  const data=await request<{items:ActionEvent[]}>(`${root(ticketId,readOnly)}/${actionId}/events`);
  if(!Array.isArray(data.items)||!data.items.every(event=>event&&positive(event.id)&&positive(event.version)&&positive(event.actor?.id)&&
    typeof event.actor.name==='string'&&typeof event.type==='string'&&Number.isFinite(Date.parse(event.createdAt))&&event.changes&&typeof event.changes==='object'))throw new ActionRequestError(0,'INVALID_RESPONSE');
  return data;
}
export async function getActionSnapshot(ticketId:number):Promise<ActionSnapshot>{
  const detail=await getStaffTicketDetail(ticketId);const version=(detail as unknown as {version:unknown}).version;
  if(typeof version!=='number'||!Number.isInteger(version)||version<1)throw new ActionRequestError(0,'INVALID_RESPONSE');
  return {id:detail.id,version,createdAt:detail.createdAt,currentStatus:detail.currentStatus};
}
export const getActionAssignees=getStaffTicketOwners;
async function mutation(path:string,method:string,body:unknown,key?:string){
  const data=await request<SavedAction>(path,method,body,key);
  // A malformed 2xx is an uncertain outcome: keep the form/key so a creation
  // can be safely replayed rather than clearing a draft without an Action ID.
  if(!validAction(data.action)||!positive(data.ticketVersion))throw new ActionRequestError(0,'INVALID_RESPONSE');
  return data;
}
export const createAction=(ticketId:number,data:ActionFields&{expectedTicketVersion:number},key:string)=>mutation(root(ticketId,false),'POST',data,key);
export const editAction=(ticketId:number,actionId:number,data:Omit<ActionFields,'assigneeUserId'>&{expectedTicketVersion:number;expectedVersion:number})=>mutation(`${root(ticketId,false)}/${actionId}`,'PATCH',data);
export const assignAction=(ticketId:number,actionId:number,data:{assigneeUserId:number;expectedTicketVersion:number;expectedVersion:number})=>mutation(`${root(ticketId,false)}/${actionId}/assignee`,'PATCH',data);
export const transitionAction=(ticketId:number,actionId:number,data:{status:ActionStatus;expectedTicketVersion:number;expectedVersion:number})=>mutation(`${root(ticketId,false)}/${actionId}/status`,'PATCH',data);
