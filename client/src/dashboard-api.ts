import { API_URL,type MyTicketsQuery,type StaffQueueQuery,type TicketStatus,type ITPriority } from './api.js';
export const ticketStates:TicketStatus[]=['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED'];
export const itPriorities:ITPriority[]=['NOT_SET','LOW','MEDIUM','HIGH','URGENT'];
export interface Summary {id:number;ticketNumber:string;summary:string;currentStatus:TicketStatus;itPriority:ITPriority;updatedAt:string}
export interface MyAction {id:number;description:string;status:string;createdAt:string;ticket:{id:number;ticketNumber:string}}
export interface RequesterDashboard {asOf:string;timeZone:'Asia/Bangkok';resolvedWindow:{start:string;end:string};metrics:{openTickets:number;waitingTickets:number;recentlyResolvedTickets:number};recentTickets:Summary[];attentionTickets:Summary[];drillDown:Record<'openTickets'|'waitingTickets'|'recentlyResolvedTickets',string>}
export interface StaffDashboard {asOf:string;timeZone:'Asia/Bangkok';metrics:{unassignedOpenTickets:number;myOpenTickets:number;myActions:number;ticketsByStatus:Record<TicketStatus,number>;openTicketsByPriority:Record<ITPriority,number>};recentTickets:Summary[];urgentTickets:Summary[];recentMyActions:MyAction[];drillDown:{unassignedOpenTickets:string;myOpenTickets:string;myActions:string;ticketsByStatus:Record<TicketStatus,string>;openTicketsByPriority:Record<ITPriority,string>}}
export class DashboardError extends Error{constructor(public status:number){super(status===401?'Your session has expired. Sign in again.':status===403?'You do not have permission to view this dashboard.':'Unable to load dashboard data. Please retry.');}}
async function read<T>(path:string):Promise<T>{let response:Response;try{response=await fetch(API_URL+path,{credentials:'include'});}catch{throw new DashboardError(0);}if(!response.ok)throw new DashboardError(response.status);try{return await response.json();}catch{throw new DashboardError(0);}}
const count=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
const date=(s:unknown)=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const summary=(x:Summary)=>x&&Number.isSafeInteger(x.id)&&x.id>0&&typeof x.ticketNumber==='string'&&typeof x.summary==='string'&&ticketStates.includes(x.currentStatus)&&itPriorities.includes(x.itPriority)&&date(x.updatedAt);
const action=(x:MyAction)=>x&&Number.isSafeInteger(x.id)&&x.id>0&&typeof x.description==='string'&&['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'].includes(x.status)&&date(x.createdAt)&&Number.isSafeInteger(x.ticket?.id)&&x.ticket.id>0&&typeof x.ticket.ticketNumber==='string';
export type Destination={kind:'requester';query:MyTicketsQuery}|{kind:'staff';query:StaffQueueQuery}|{kind:'actions'};
/** The backend supplies exact query paths, never arbitrary navigation URLs. */
export function dashboardDestination(path:string,requester:boolean):Destination{
  if(typeof path!=='string'||!path.startsWith('/')||path.startsWith('//'))throw new DashboardError(0);
  const url=new URL(path,'http://dashboard.invalid');
  if(url.origin!=='http://dashboard.invalid'||url.hash)throw new DashboardError(0);
  if(!requester&&url.pathname==='/staff/actions'&&url.search==='?performedBy=me')return {kind:'actions'};
  if(url.pathname!==(requester?'/api/tickets':'/staff/tickets'))throw new DashboardError(0);
  const q:Record<string,unknown>={};const seen=new Set<string>();for(const [key,value]of url.searchParams){
    if(seen.has(key))throw new DashboardError(0);seen.add(key);
    if(key==='status'&&ticketStates.includes(value as TicketStatus))q[requester?'currentStatus':'status']=value;
    else if(key==='statusGroup'&&(value==='open'||requester&&value==='resolved'))q.statusGroup=value;
    else if(requester&&['resolvedSince','resolvedBefore'].includes(key)&&date(value))q[key]=value;
    else if(!requester&&key==='unassigned'&&value==='true')q.unassigned=true;
    else if(!requester&&key==='ownerId'&&/^[1-9]\d*$/.test(value)&&Number.isSafeInteger(Number(value)))q.ownerId=Number(value);
    else if(!requester&&key==='priority'&&itPriorities.includes(value as ITPriority))q.itPriority=value;
    else throw new DashboardError(0);
  }
  return requester?{kind:'requester',query:q as MyTicketsQuery}:{kind:'staff',query:q as StaffQueueQuery};
}
export async function getDashboard(requester:boolean):Promise<RequesterDashboard|StaffDashboard>{
  const d=await read<any>(requester?'/api/tickets/dashboard':'/staff/dashboard');
  if(!d||!date(d.asOf)||d.timeZone!=='Asia/Bangkok'||!Array.isArray(d.recentTickets)||!d.recentTickets.every(summary)||!d.metrics||!d.drillDown)throw new DashboardError(0);
  const keys=requester?['openTickets','waitingTickets','recentlyResolvedTickets']:['unassignedOpenTickets','myOpenTickets','myActions'];
  if(!keys.every(k=>count(d.metrics[k])&&typeof d.drillDown[k]==='string'))throw new DashboardError(0);
  const paths:string[]=keys.map(k=>d.drillDown[k]);
  if(requester){if(!date(d.resolvedWindow?.start)||!date(d.resolvedWindow?.end)||!Array.isArray(d.attentionTickets)||!d.attentionTickets.every(summary))throw new DashboardError(0);}
  else{if(!ticketStates.every(k=>count(d.metrics.ticketsByStatus?.[k])&&typeof d.drillDown.ticketsByStatus?.[k]==='string')||!itPriorities.every(k=>count(d.metrics.openTicketsByPriority?.[k])&&typeof d.drillDown.openTicketsByPriority?.[k]==='string')||!Array.isArray(d.urgentTickets)||!d.urgentTickets.every(summary)||!Array.isArray(d.recentMyActions)||!d.recentMyActions.every(action))throw new DashboardError(0);paths.push(...Object.values(d.drillDown.ticketsByStatus) as string[],...Object.values(d.drillDown.openTicketsByPriority) as string[]);}
  paths.forEach(path=>dashboardDestination(path,requester));return d;
}
export async function getMyActions(page=1){const d=await read<{items:MyAction[];page:number;totalPages:number;totalItems:number}>(`/staff/actions?performedBy=me&page=${page}&pageSize=10`);if(!Array.isArray(d.items)||!d.items.every(action)||!Number.isInteger(d.page)||d.page<1||!Number.isInteger(d.totalPages)||d.totalPages<1||!count(d.totalItems))throw new DashboardError(0);return d;}
