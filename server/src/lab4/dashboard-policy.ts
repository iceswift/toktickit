import { Prisma, TicketStatus } from '@prisma/client';
import { badInput } from './action-validation.js';
export const openStatuses:TicketStatus[]=['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED'];
export function resolvedWindow(asOf:Date){
  const local=new Date(asOf.getTime()+7*3600000);
  return {start:new Date(Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate()-6)-7*3600000).toISOString(),end:asOf.toISOString()};
}
function instant(value:unknown){
  if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value))return badInput('resolvedWindow');
  const day=new Date(value.slice(0,10)+'T00:00:00Z');const result=new Date(value);
  if(!Number.isFinite(result.getTime())||!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==value.slice(0,10))return badInput('resolvedWindow');return result;
}
/** Additional constraints shared by list drill-downs; session ownership remains
 * mandatory in the Requester list route, never provided by the query string. */
export function dashboardScope(query:Record<string,unknown>,staff:boolean):Prisma.TicketWhereInput{
  const group=query.statusGroup,from=query.resolvedSince,to=query.resolvedBefore;
  if(query.currentStatus!==undefined&&query.status!==undefined&&query.currentStatus!==query.status)return badInput('status');
  if(group!==undefined&&(!['open',...(!staff?['resolved']:[])].includes(group as string)||query.status!==undefined||query.currentStatus!==undefined))return badInput('statusGroup');
  if(query.unassigned!==undefined&&(!staff||query.unassigned!=='true'||query.ownerId!==undefined))return badInput('unassigned');
  if((from!==undefined||to!==undefined)&&(staff||group!=='resolved'||from===undefined||to===undefined))return badInput('resolvedWindow');
  if(query.priority!==undefined&&query.itPriority!==undefined&&query.priority!==query.itPriority)return badInput('priority');
  if(query.priority!==undefined&&(!staff||!['NOT_SET','LOW','MEDIUM','HIGH','URGENT'].includes(query.priority as string)))return badInput('priority');
  let range:Prisma.DateTimeNullableFilter|undefined;
  if(from!==undefined){const gte=instant(from),lt=instant(to);if(gte>=lt)return badInput('resolvedWindow');range={gte,lt};}
  return {...(group?{currentStatus:{in:group==='open'?openStatuses:['RESOLVED','CLOSED'] as TicketStatus[]}}:{}),
    ...(query.unassigned==='true'?{ownerUserId:null}:{}),...(range?{lastResolvedAt:range}:{})};
}
