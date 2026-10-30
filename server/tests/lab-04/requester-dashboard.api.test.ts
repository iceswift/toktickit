import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { dashboardRoleFixture } from './dashboard-role-fixture.js';
describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('Requester Dashboard owned population regression',()=>{
  let f:Awaited<ReturnType<typeof dashboardRoleFixture>>;
  beforeAll(async()=>{f=await dashboardRoleFixture('requester_dash');},120000);afterAll(async()=>{await f?.db.$disconnect();});
  it('returns only owned metrics/attention and owned Waiting drill-down',async()=>{const d=await request(app).get('/api/tickets/dashboard').set('Cookie',f.owner.cookie);expect(d.status).toBe(200);expect(d.body.metrics).toEqual({openTickets:1,waitingTickets:1,recentlyResolvedTickets:0});expect(d.body.attentionTickets.map((t:any)=>t.id)).toEqual([f.ticket.id]);expect(JSON.stringify(d.body)).not.toContain('PRIVATE-P7');const list=await request(app).get(d.body.drillDown.waitingTickets).set('Cookie',f.owner.cookie);expect(list.body.totalItems).toBe(1);});
  it('isolates a second Requester and rejects Staff dashboard impersonation',async()=>{const d=await request(app).get('/api/tickets/dashboard').set('Cookie',f.other.cookie);expect(d.body.metrics.openTickets).toBe(0);expect(d.body.recentTickets).toEqual([]);expect((await request(app).get('/staff/dashboard').set('Cookie',f.owner.cookie)).status).toBe(403);});
});
