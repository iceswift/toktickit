import { describe,it,expect } from 'vitest';
import { resolvedWindow, dashboardScope } from '../../src/lab4/dashboard-policy.js';
describe('Bangkok window and exact drill-down validation',()=>{
  it.each([
    ['2026-10-29T16:59:59.999Z','2026-10-22T17:00:00.000Z'],
    ['2026-10-29T17:00:00.000Z','2026-10-23T17:00:00.000Z'],
    ['2026-01-01T00:00:00.000Z','2025-12-25T17:00:00.000Z'],
  ])('starts six local calendar days before %s', (asOf,start)=>{expect(resolvedWindow(new Date(asOf))).toEqual({start,end:asOf});});
  it('uses identical five open states and unassigned constraint',()=>{expect(dashboardScope({statusGroup:'open',unassigned:'true'},true)).toEqual({currentStatus:{in:['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED']},ownerUserId:null});});
  it.each([{statusGroup:'bad'},{statusGroup:'open',status:'CLOSED'},{unassigned:'true',ownerId:'1'},{unassigned:'false'},{resolvedSince:'2026-01-01T00:00:00Z'},{statusGroup:'resolved',resolvedSince:'2026-02-30T00:00:00Z',resolvedBefore:'2026-03-02T00:00:00Z'},{statusGroup:'resolved',resolvedSince:'2026-03-02T00:00:00Z',resolvedBefore:'2026-03-01T00:00:00Z'}])('rejects invalid/contradictory filters %j',query=>{expect(()=>dashboardScope(query,true)).toThrow();expect(()=>dashboardScope(query,false)).toThrow();});
  it('accepts a timezone-qualified Requester half-open range and includes Closed work',()=>{expect(dashboardScope({statusGroup:'resolved',resolvedSince:'2026-10-23T00:00:00+07:00',resolvedBefore:'2026-10-30T00:00:00+07:00'},false)).toMatchObject({currentStatus:{in:['RESOLVED','CLOSED']},lastResolvedAt:{gte:new Date('2026-10-22T17:00:00Z'),lt:new Date('2026-10-29T17:00:00Z')}});});
});
