import { createHash, randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';
import { newDatabase, prismaCommand, runSeed } from './database-fixture.js';
const matrix:Record<string,string[]>={NEW:['OPEN','IN_PROGRESS','CANCELLED'],OPEN:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],IN_PROGRESS:['WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],WAITING_FOR_REQUESTER:['IN_PROGRESS','RESOLVED','CANCELLED'],RESOLVED:['CLOSED','REOPENED'],CLOSED:['REOPENED'],REOPENED:['IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CANCELLED'],CANCELLED:[]};
describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('Phase5 real Ticket workflow HTTP',()=>{
  let db:ReturnType<typeof getPrisma>,staff:string,admin:string,owner:string,other:string,first:string,inactive:string;
  let actor:number,requester:number,legacy:number,category:number,system:number;
  beforeAll(async()=>{
    const url=newDatabase('workflowapi');prismaCommand(url,['migrate','deploy']);runSeed(url);process.env.DATABASE_URL=url;db=getPrisma();
    async function session(email:string){const u=await db.user.update({where:{email},data:{mustChangePassword:false}});const token=randomBytes(32).toString('base64url');await db.authSession.create({data:{userId:u.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000)}});return {u,cookie:`toktickit_session=${token}`};}
    const [s,a,o,x,f,i]=await Promise.all(['iris.nattapong@example.test','narin.admin@example.test','amina.rahman@example.test','ben.carter@example.test','jonas.miller@example.test','retired.staff@example.test'].map(session));
    staff=s.cookie;actor=s.u.id;admin=a.cookie;owner=o.cookie;other=x.cookie;requester=o.u.id;legacy=o.u.developmentRequesterId!;first=f.cookie;inactive=i.cookie;
    await db.user.update({where:{id:f.u.id},data:{mustChangePassword:true}});
    category=(await db.category.findFirstOrThrow()).id;system=(await db.relatedSystem.findFirstOrThrow()).id;
  },120000);
  afterAll(async()=>{if(db)await db.$disconnect();});
  async function fixture(status:keyof typeof matrix='OPEN',actionStatus?:'COMPLETED'|'PLANNED'|'CANCELLED',followUp=false){
    return db.$transaction(async tx=>{
      const t=await tx.ticket.create({data:{ticketNumber:`TKT-P5-${randomUUID()}`,requesterId:legacy,requesterUserId:requester,categoryId:category,relatedSystemId:system,summary:'Synthetic Phase5 matrix fixture',description:'Test-only work; no real service history.',requestedPriority:'MEDIUM',currentStatus:status as any,createdAt:new Date('2026-10-28T01:00:00Z'),version:actionStatus?2:1}});
      if(actionStatus){const a=await tx.actionTaken.create({data:{ticketId:t.id,performedByUserId:actor,assigneeUserId:actor,actionDateTime:new Date('2026-10-28T02:00:00Z'),description:'Synthetic prerequisite',result:actionStatus==='COMPLETED'?'Verified':'',status:actionStatus,followUpRequired:followUp,followUpNote:followUp?'Pending confirmation':''}});await tx.actionEvent.create({data:{ticketId:t.id,actionId:a.id,actorId:actor,type:'CREATED',version:1,changes:{fixture:true,status:actionStatus}}});}
      return t;
    });
  }
  const patch=(id:number,status:string,version:number,cookie=staff)=>request(app).patch(`/staff/tickets/${id}/status`).set('Cookie',cookie).send({status,expectedVersion:version});
  it('Administrator can perform an approved final transition with a supplied version',async()=>{
    const t=await fixture('NEW');const r=await patch(t.id,'OPEN',1,admin);expect(r.status).toBe(200);expect(r.body.currentStatus).toBe('OPEN');
  });
  for(const from of Object.keys(matrix))for(const to of Object.keys(matrix))it(`HTTP matrix ${from} -> ${to} for Staff and Admin`,async()=>{
    for(const cookie of [staff,admin]){
      const t=await fixture(from,'COMPLETED');const allowed=matrix[from].includes(to);const r=await patch(t.id,to,t.version,cookie);
      expect(r.status,JSON.stringify(r.body)).toBe(allowed?200:409);
      const saved=await db.ticket.findUniqueOrThrow({where:{id:t.id},include:{workflowEvents:true}});
      expect(saved.currentStatus).toBe(allowed?to:from);expect(saved.version).toBe(t.version+(allowed?1:0));
      expect(saved.workflowEvents).toHaveLength(allowed?1:0);
      if(allowed)expect(saved.workflowEvents[0]).toMatchObject({fromStatus:from,toStatus:to,version:saved.version});
    }
  });
  it('rejects all three Resolve gate reasons and Cancel with open work without partial changes',async()=>{
    for(const [status,follow,reason] of [[undefined,false,'NO_COMPLETED_ACTION'],['CANCELLED',false,'NO_COMPLETED_ACTION'],['COMPLETED',true,'FOLLOW_UP_PENDING']] as const){
      const t=await fixture('OPEN',status,follow);const r=await patch(t.id,'RESOLVED',t.version);expect(r.status).toBe(409);expect(r.body.fields.reason).toBe(reason);
      expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).version).toBe(t.version);expect(await db.ticketWorkflowEvent.count({where:{ticketId:t.id}})).toBe(0);
      console.log('WORKFLOW_GATE_PROOF',JSON.stringify({reason,status:r.status,body:r.body}));
    }
    const t=await fixture('OPEN','COMPLETED');const a=await request(app).post(`/staff/tickets/${t.id}/actions`).set('Cookie',staff).set('Idempotency-Key',randomUUID()).send({expectedTicketVersion:2,assigneeUserId:actor,description:'Open work',followUpRequired:false,actionDateTime:new Date().toISOString()});expect(a.status).toBe(201);
    const open=await patch(t.id,'RESOLVED',3),cancel=await patch(t.id,'CANCELLED',3);
    expect(open.body.fields.reason).toBe('OPEN_ACTIONS');expect(open.status).toBe(409);expect(cancel.status).toBe(409);
    console.log('WORKFLOW_GATE_PROOF',JSON.stringify({reason:'OPEN_ACTIONS',resolve:{status:open.status,body:open.body},cancel:{status:cancel.status,body:cancel.body}}));
  });
  it('never infers versions for legacy Tickets; rejects spoofed/unknown fields and stale versions',async()=>{
    const t=await fixture('NEW');
    expect((await request(app).patch(`/staff/tickets/${t.id}/status`).set('Cookie',staff).send({status:'OPEN'})).status).toBe(409);
    expect((await request(app).patch(`/staff/tickets/${t.id}/status`).set('Cookie',staff).send({status:'OPEN',expectedVersion:1,actorId:999})).status).toBe(400);
    expect((await patch(t.id,'OPEN',99)).status).toBe(409);expect((await patch(t.id,'OPEN',1)).status).toBe(200);expect((await patch(t.id,'IN_PROGRESS',1)).status).toBe(409);
  });
  it('enforces session roles, inactive and mandatory-password denial on formal transitions',async()=>{
    const t=await fixture('NEW');
    expect((await request(app).patch(`/staff/tickets/${t.id}/status`).send({status:'OPEN',expectedVersion:1})).status).toBe(401);
    for(const [cookie,status] of [[owner,403],[first,403],[inactive,401]] as const)expect((await patch(t.id,'OPEN',1,cookie)).status).toBe(status);
    expect((await patch(2147483647,'OPEN',1)).status).toBe(404);
  });
  it('preserves legacy terminal Tickets with zero Actions and unknown dates without inventing history',async()=>{
    for(const status of ['RESOLVED','CLOSED']){
      const t=await fixture(status);const read=await request(app).get(`/staff/tickets/${t.id}/workflow-events`).set('Cookie',staff);
      expect(read.status).toBe(200);expect(read.body.items).toEqual([]);expect(read.body.ticket.lastResolvedAt).toBeNull();
      expect((await patch(t.id,'REOPENED',1)).status).toBe(200);
      const resolve=await patch(t.id,'RESOLVED',2);expect(resolve.status).toBe(409);expect(resolve.body.fields.reason).toBe('NO_COMPLETED_ACTION');
      const saved=await db.ticket.findUniqueOrThrow({where:{id:t.id},include:{workflowEvents:true,actions:true}});expect(saved.lastResolvedAt).toBeNull();expect(saved.actions).toEqual([]);expect(saved.workflowEvents).toHaveLength(1);
    }
  });
  it('keeps Requester indication advisory and scopes immutable status history to owned Tickets',async()=>{
    const t=await fixture('OPEN','COMPLETED');
    const indication=await request(app).patch(`/api/tickets/${t.id}/problem-appears-resolved`).set('Cookie',owner).send({appearsResolved:true});expect(indication.status).toBe(200);
    expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).currentStatus).toBe('OPEN');expect(await db.ticketWorkflowEvent.count({where:{ticketId:t.id}})).toBe(0);
    expect((await patch(t.id,'RESOLVED',2)).status).toBe(200);const resolved=(await db.ticket.findUniqueOrThrow({where:{id:t.id}})).lastResolvedAt;expect(resolved).not.toBeNull();
    expect((await patch(t.id,'CLOSED',3)).status).toBe(200);expect((await patch(t.id,'REOPENED',4)).status).toBe(200);
    expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).lastResolvedAt).toEqual(resolved);
    await db.internalNote.create({data:{ticketId:t.id,authorId:actor,content:'PRIVATE-P5-SENTINEL'}});
    const response=await request(app).get(`/api/tickets/${t.id}/workflow-events`).set('Cookie',owner);expect(response.status).toBe(200);expect(response.body.items.map((e:any)=>e.version)).toEqual([3,4,5]);expect(JSON.stringify(response.body)).not.toMatch(/PRIVATE-P5-SENTINEL|tokenHash|passwordHash|internalNotes/);
    expect((await request(app).get(`/api/tickets/${t.id}/workflow-events`).set('Cookie',other)).status).toBe(404);
    await expect(db.ticketWorkflowEvent.update({where:{id:response.body.items[0].id},data:{toStatus:'CANCELLED'}})).rejects.toThrow();
    await expect(db.ticketWorkflowEvent.delete({where:{id:response.body.items[0].id}})).rejects.toThrow();
  });
  for(const kind of ['create','follow-up','transition'] as const)it(`serializes actual HTTP Resolve against ${kind} without bypass`,async()=>{
    for(let round=0;round<3;round++){
      const t=await fixture('OPEN','COMPLETED');const a=await db.actionTaken.findFirstOrThrow({where:{ticketId:t.id}});
      const competitor=kind==='create'?request(app).post(`/staff/tickets/${t.id}/actions`).set('Cookie',staff).set('Idempotency-Key',randomUUID()).send({expectedTicketVersion:2,assigneeUserId:actor,description:'Competing work',followUpRequired:false,actionDateTime:new Date().toISOString()})
        :kind==='follow-up'?request(app).patch(`/staff/tickets/${t.id}/actions/${a.id}`).set('Cookie',staff).send({expectedTicketVersion:2,expectedVersion:1,followUpRequired:true,followUpNote:'Competing follow-up'})
        :patch(t.id,'WAITING_FOR_REQUESTER',2);
      const results=await Promise.all([patch(t.id,'RESOLVED',2),competitor]);expect(results.filter(r=>r.status===200||r.status===201)).toHaveLength(1);expect(results.filter(r=>r.status===409)).toHaveLength(1);
      const saved=await db.ticket.findUniqueOrThrow({where:{id:t.id},include:{actions:true,workflowEvents:true}});expect(saved.version).toBe(3);
      if(saved.currentStatus==='RESOLVED'){expect(saved.actions.some(a=>a.status==='COMPLETED')).toBe(true);expect(saved.actions.some(a=>['PLANNED','IN_PROGRESS'].includes(a.status)||a.followUpRequired)).toBe(false);expect(saved.workflowEvents).toHaveLength(1);}
      console.log('WORKFLOW_RACE_PROOF',JSON.stringify({kind,round,statuses:results.map(r=>r.status),final:saved.currentStatus,version:saved.version}));
    }
  });
});
