import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { dashboardRoleFixture } from './dashboard-role-fixture.js';
describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('Staff/Admin Dashboard performer/owner regression',()=>{
  let f:Awaited<ReturnType<typeof dashboardRoleFixture>>;
  beforeAll(async()=>{f=await dashboardRoleFixture('staff_dash');await f.db.$transaction(async tx=>{const action=await tx.actionTaken.create({data:{ticketId:f.ticket.id,performedByUserId:f.staff.id,assigneeUserId:f.admin.id,actionDateTime:new Date(),description:'Work by Staff, assigned to Admin'}});await tx.actionEvent.create({data:{actionId:action.id,ticketId:f.ticket.id,actorId:f.staff.id,type:'CREATED',version:1,changes:{syntheticRoleFixture:true}}});await tx.ticket.update({where:{id:f.ticket.id},data:{version:{increment:1}}});});},120000);afterAll(async()=>{await f?.db.$disconnect();});
  it('counts current owner and performer, not assigned-to work',async()=>{const d=await request(app).get('/staff/dashboard').set('Cookie',f.staff.cookie);expect(d.status).toBe(200);expect(d.body.metrics.myOpenTickets).toBe(1);expect(d.body.metrics.myActions).toBe(1);expect(d.body.metrics.unassignedOpenTickets).toBe(0);expect(d.body.urgentTickets[0].id).toBe(f.ticket.id);const work=await request(app).get(d.body.drillDown.myActions).set('Cookie',f.staff.cookie);expect(work.body.totalItems).toBe(1);});
  it('allows Admin operational totals but does not count assigned-only work as performed',async()=>{const d=await request(app).get('/staff/dashboard').set('Cookie',f.admin.cookie);expect(d.status).toBe(200);expect(d.body.metrics.myActions).toBe(0);expect(d.body.metrics.myOpenTickets).toBe(0);expect(d.body.metrics.ticketsByStatus.WAITING_FOR_REQUESTER).toBe(1);expect(d.body.metrics.openTicketsByPriority.URGENT).toBe(1);});
});
