import { createHash, randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';
import { newDatabase, prismaCommand, runSeed } from './database-fixture.js';

describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('Lab4 real Action API / authentication / history / replay', () => {
  let db: ReturnType<typeof getPrisma>;
  let staff: string, admin: string, owner: string, other: string, inactive: string, firstLogin: string;
  let staffId: number, assigneeId: number, ownerId: number, legacyId: number, categoryId: number, systemId: number;
  beforeAll(async () => {
    const url = newDatabase('actionapi');
    prismaCommand(url,['migrate','deploy']); runSeed(url);
    process.env.DATABASE_URL = url;
    db = getPrisma();
    async function session(email: string) {
      const user = await db.user.update({ where:{email},data:{mustChangePassword:false} });
      const token = randomBytes(32).toString('base64url');
      await db.authSession.create({data:{userId:user.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600_000)}});
      return {cookie:`toktickit_session=${token}`,user};
    }
    const [s,a,o,x] = await Promise.all(['iris.nattapong@example.test','narin.admin@example.test','amina.rahman@example.test','ben.carter@example.test'].map(session));
    staff=s.cookie;staffId=s.user.id;admin=a.cookie;owner=o.cookie;ownerId=o.user.id;legacyId=o.user.developmentRequesterId!;other=x.cookie;
    assigneeId=(await db.user.findUniqueOrThrow({where:{email:'jonas.miller@example.test'}})).id;
    const blocked=await session('jonas.miller@example.test'); firstLogin=blocked.cookie;
    await db.user.update({where:{id:assigneeId},data:{mustChangePassword:true}});
    const disabled=await db.user.create({data:{email:`disabled-${randomUUID()}@example.test`,name:'Disabled synthetic staff',passwordHash:'disabled-synthetic-no-login',role:'IT_STAFF',isActive:false,mustChangePassword:false}});
    const token=randomBytes(32).toString('base64url');
    await db.authSession.create({data:{userId:disabled.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600_000)}});inactive=`toktickit_session=${token}`;
    categoryId=(await db.category.findFirstOrThrow({where:{isActive:true}})).id;
    systemId=(await db.relatedSystem.findFirstOrThrow({where:{isActive:true}})).id;
  },120_000);
  afterAll(async()=>{if(db)await db.$disconnect();});
  async function ticket() {
    return db.ticket.create({data:{ticketNumber:`TKT-P3-${randomUUID()}`,requesterId:legacyId,requesterUserId:ownerId,
      ownerUserId:staffId,categoryId,relatedSystemId:systemId,summary:'Synthetic Action API fixture',description:'No private data',
      requestedPriority:'MEDIUM',currentStatus:'OPEN',createdAt:new Date('2026-10-28T01:00:00Z')}});
  }
  function input(version=1) { return {expectedTicketVersion:version,assigneeUserId:assigneeId,actionDateTime:'2026-10-28T02:00:00Z',description:'  Inspect device  ',followUpRequired:false}; }
  function create(id:number,body=input(),key:string=randomUUID(),cookie=staff){return request(app).post(`/staff/tickets/${id}/actions`).set('Cookie',cookie).set('Idempotency-Key',key).send(body);}
  async function versions(id:number){return (await db.ticket.findUniqueOrThrow({where:{id}})).version;}

  it('creates under the correct parent and immutable session actor, without changing Ticket owner',async()=>{
    const t=await ticket();const response=await create(t.id);
    expect(response.status).toBe(201);expect(response.body.ticketVersion).toBe(2);
    expect(response.body.action).toMatchObject({ticketId:t.id,performedBy:{id:staffId},assignee:{id:assigneeId},status:'PLANNED',version:1,description:'Inspect device'});
    expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).ownerUserId).toBe(staffId);
    expect(await db.actionEvent.count({where:{actionId:response.body.action.id}})).toBe(1);
  });
  it('protects all reads/writes and the sibling /staff/actions route by actual session/role',async()=>{
    const t=await ticket();
    for(const [cookie,status] of [[undefined,401],[owner,403],[inactive,401],[firstLogin,403]] as const){
      const route=request(app).post(`/staff/tickets/${t.id}/actions`).set('Idempotency-Key',randomUUID());if(cookie)route.set('Cookie',cookie);
      expect((await route.send(input())).status).toBe(status);
      const list=request(app).get('/staff/actions?performedBy=me');if(cookie)list.set('Cookie',cookie);expect((await list).status).toBe(status);
    }
    expect((await create(t.id,input(),randomUUID(),admin)).status).toBe(201);
    expect((await request(app).get('/staff/ticket-owners')).status).toBe(401);
  });
  it('allows only owned Requester reads and never shares Notes, credentials or other-parent history',async()=>{
    const t=await ticket();const a=(await create(t.id)).body.action;const different=await ticket();
    await db.internalNote.create({data:{ticketId:t.id,authorId:staffId,content:'PRIVATE-NOTE-SENTINEL'}});
    for(const suffix of ['/actions',`/actions/${a.id}/events`,'/workflow-events']){
      const allowed=await request(app).get(`/api/tickets/${t.id}${suffix}`).set('Cookie',owner);expect(allowed.status).toBe(200);
      expect(JSON.stringify(allowed.body)).not.toMatch(/PRIVATE-NOTE-SENTINEL|passwordHash|tokenHash|internalNotes/);
      const denied=await request(app).get(`/api/tickets/${t.id}${suffix}`).set('Cookie',other);
      expect(denied.status).toBe(404);
      console.log('NEGATIVE_API_PROOF',JSON.stringify({case:'cross-requester',pathSuffix:suffix,status:denied.status,body:denied.body}));
    }
    expect((await request(app).get(`/api/tickets/${different.id}/actions/${a.id}/events`).set('Cookie',owner)).status).toBe(404);
    expect((await request(app).post(`/api/tickets/${t.id}/actions`).set('Cookie',owner).send(input())).status).toBe(403);
  });
  it('replays a persistent normalized payload before stale checks with no duplicate work/history',async()=>{
    const t=await ticket();const key=randomUUID();const first=await create(t.id,input(),key);expect(first.status).toBe(201);
    const replay=await create(t.id,{...input(999),description:'Inspect device'},key);
    expect(replay.status).toBe(200);expect(replay.body).toMatchObject({replayed:true,action:{id:first.body.action.id}});
    expect(await db.actionTaken.count({where:{ticketId:t.id}})).toBe(1);expect(await db.actionEvent.count({where:{ticketId:t.id}})).toBe(1);
    expect(await versions(t.id)).toBe(2);expect(await db.idempotencyRecord.count({where:{ticketId:t.id}})).toBe(1);
    const mismatch=await create(t.id,{...input(2),description:'Different payload'},key);
    expect(mismatch.status).toBe(409);
    console.log('NEGATIVE_API_PROOF',JSON.stringify({case:'idempotency-payload-mismatch',status:mismatch.status,body:mismatch.body}));
    const saved=await db.idempotencyRecord.findFirstOrThrow({where:{ticketId:t.id}});expect(saved.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });
  it('serializes simultaneous identical retries and rejects simultaneous different-key stale writes',async()=>{
    const t=await ticket();const key=randomUUID();const responses=await Promise.all([create(t.id,input(),key),create(t.id,input(),key)]);
    expect(responses.map(r=>r.status).sort()).toEqual([200,201]);expect(await db.actionTaken.count({where:{ticketId:t.id}})).toBe(1);
    const another=await ticket();const competing=await Promise.all([create(another.id),create(another.id)]);
    expect(competing.map(r=>r.status).sort()).toEqual([201,409]);expect(await versions(another.id)).toBe(2);
  });
  it('validates parent date range, unknown identity fields, inactive assignees and retry keys without partial saves',async()=>{
    const t=await ticket();const disabled=await db.user.findFirstOrThrow({where:{isActive:false,role:'IT_STAFF'}});
    for(const body of [{...input(),performedByUserId:99},{...input(),actionDateTime:'2026-10-27T00:00:00Z'},
      {...input(),actionDateTime:'2099-01-01T00:00:00Z'},{...input(),assigneeUserId:disabled.id},
      {...input(),assigneeUserId:ownerId},{...input(),followUpRequired:true}]) expect((await create(t.id,body)).status).toBe(400);
    expect((await create(t.id,input(),'short')).status).toBe(400);
    expect(await versions(t.id)).toBe(1);expect(await db.actionTaken.count({where:{ticketId:t.id}})).toBe(0);
  });
  it('edits, assigns and transitions atomically, retaining before/after audit and terminal rules',async()=>{
    const t=await ticket();const action=(await create(t.id)).body.action;
    const patch=(suffix:string,data:object)=>request(app).patch(`/staff/tickets/${t.id}/actions/${action.id}${suffix}`).set('Cookie',staff).send(data);
    expect((await patch('',{expectedVersion:1,expectedTicketVersion:2,result:'Connectivity restored'})).status).toBe(200);
    expect((await patch('/assignee',{expectedVersion:2,expectedTicketVersion:3,assigneeUserId:staffId})).status).toBe(200);
    expect((await patch('/status',{expectedVersion:3,expectedTicketVersion:4,status:'COMPLETED'})).status).toBe(409);
    expect((await patch('/status',{expectedVersion:3,expectedTicketVersion:4,status:'IN_PROGRESS'})).status).toBe(200);
    expect((await patch('/status',{expectedVersion:4,expectedTicketVersion:5,status:'COMPLETED'})).status).toBe(200);
    expect((await patch('',{expectedVersion:5,expectedTicketVersion:6,result:''})).status).toBe(400);
    expect((await patch('/status',{expectedVersion:5,expectedTicketVersion:6,status:'CANCELLED'})).status).toBe(409);
    const events=await request(app).get(`/staff/tickets/${t.id}/actions/${action.id}/events`).set('Cookie',staff);
    expect(events.body.items.map((e:{version:number})=>e.version)).toEqual([1,2,3,4,5]);
    expect(events.body.items[1].changes.result).toEqual({before:'',after:'Connectivity restored'});
    expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).ownerUserId).toBe(staffId);
  });
  it('enforces merged follow-up/result values and stale edit checks without bumping versions',async()=>{
    const t=await ticket();const a=(await create(t.id)).body.action;
    const base=`/staff/tickets/${t.id}/actions/${a.id}`;
    const patch=async(body:object)=>request(app).patch(base).set('Cookie',staff).send(body);
    expect((await patch({expectedVersion:1,expectedTicketVersion:2,followUpRequired:true})).status).toBe(400);
    expect((await patch({expectedVersion:99,expectedTicketVersion:2,description:'stale'})).status).toBe(409);
    expect(await versions(t.id)).toBe(2);
    expect((await patch({expectedVersion:1,expectedTicketVersion:2,followUpRequired:true,followUpNote:'Check with requester'})).status).toBe(200);
    expect((await request(app).patch(base+'/status').set('Cookie',staff).send({expectedVersion:2,expectedTicketVersion:3,status:'IN_PROGRESS'})).status).toBe(200);
    expect((await request(app).patch(base+'/status').set('Cookie',staff).send({expectedVersion:3,expectedTicketVersion:4,status:'COMPLETED'})).status).toBe(400);
  });
  it('blocks terminal Ticket writes, rechecks replay authentication, and rejects wrong parents',async()=>{
    const t=await ticket();const key=randomUUID();const a=(await create(t.id,input(),key)).body.action;const another=await ticket();
    expect((await request(app).patch(`/staff/tickets/${another.id}/actions/${a.id}`).set('Cookie',staff).send({expectedTicketVersion:1,expectedVersion:1,description:'Wrong parent'})).status).toBe(404);
    await db.ticket.update({where:{id:t.id},data:{currentStatus:'CLOSED'}}); // synthetic setup, not application writer
    expect((await create(t.id,input(2))).status).toBe(409);
    expect((await request(app).patch(`/staff/tickets/${t.id}/actions/${a.id}`).set('Cookie',staff).send({expectedTicketVersion:2,expectedVersion:1,description:'Forbidden'})).status).toBe(409);
    expect((await create(t.id,input(999),key)).status).toBe(200); // legitimate lost-response replay, not a new write
    await db.user.update({where:{id:staffId},data:{isActive:false}});
    expect((await create(t.id,input(),key)).status).toBe(401);
    await db.user.update({where:{id:staffId},data:{isActive:true}});
  });
  it('returns stable paginated lists, safe own-created work, and rejects invalid paging',async()=>{
    const t=await ticket();for(let n=0;n<12;n++)expect((await create(t.id,input(n+1))).status).toBe(201);
    const list=await request(app).get(`/api/tickets/${t.id}/actions?page=2&pageSize=10`).set('Cookie',owner);
    expect(list.status).toBe(200);expect(list.body).toMatchObject({page:2,pageSize:10,totalItems:12,totalPages:2});expect(list.body.items).toHaveLength(2);
    expect(list.body.items[0].id).toBeLessThan(list.body.items[1].id);
    const own=await request(app).get('/staff/actions?performedBy=me&pageSize=50').set('Cookie',staff);expect(own.status).toBe(200);
    expect(own.body.items.every((a:{performedBy:{id:number};ticket:{ticketNumber:string}})=>a.performedBy.id===staffId && a.ticket.ticketNumber)).toBe(true);
    expect((await request(app).get(`/staff/tickets/${t.id}/actions?pageSize=11`).set('Cookie',staff)).status).toBe(400);
    expect((await request(app).get('/staff/actions?performedBy=123').set('Cookie',staff)).status).toBe(400);
  });
  it('prevents the legacy status writer bypassing Action gates or shared versions',async()=>{
    const t=await ticket();await create(t.id);
    const response=await request(app).patch(`/staff/tickets/${t.id}/status`).set('Cookie',staff).send({status:'RESOLVED',expectedVersion:2});
    expect(response.status).toBe(409);
    console.log('NEGATIVE_API_PROOF',JSON.stringify({case:'legacy-resolution-bypass',status:response.status,body:response.body}));
    expect((await db.ticket.findUniqueOrThrow({where:{id:t.id}})).currentStatus).toBe('OPEN');
    expect(await versions(t.id)).toBe(2);
    const missing=await request(app).patch(`/staff/tickets/${t.id}/status`).set('Cookie',staff).send({status:'IN_PROGRESS'});
    expect(missing.status).toBe(409);
  });
  it('serializes actual HTTP Resolve vs Action creation, then retains immutable workflow history',async()=>{
    const t=await ticket();const action=(await create(t.id)).body.action;
    const endpoint=`/staff/tickets/${t.id}/actions/${action.id}`;
    expect((await request(app).patch(endpoint).set('Cookie',staff).send({expectedTicketVersion:2,expectedVersion:1,result:'Verified connection'})).status).toBe(200);
    expect((await request(app).patch(endpoint+'/status').set('Cookie',staff).send({expectedTicketVersion:3,expectedVersion:2,status:'IN_PROGRESS'})).status).toBe(200);
    expect((await request(app).patch(endpoint+'/status').set('Cookie',staff).send({expectedTicketVersion:4,expectedVersion:3,status:'COMPLETED'})).status).toBe(200);
    const responses=await Promise.all([
      request(app).patch(`/staff/tickets/${t.id}/status`).set('Cookie',staff).send({status:'RESOLVED',expectedVersion:5}),
      create(t.id,input(5)),
    ]);
    expect(responses.filter(r=>r.status===200||r.status===201)).toHaveLength(1);
    expect(responses.filter(r=>r.status===409)).toHaveLength(1);
    const saved=await db.ticket.findUniqueOrThrow({where:{id:t.id},include:{actions:true,workflowEvents:true}});
    expect(saved.version).toBe(6);
    if(saved.currentStatus==='RESOLVED'){
      expect(saved.actions.every(a=>a.status==='COMPLETED')).toBe(true);expect(saved.lastResolvedAt).not.toBeNull();
      expect(saved.workflowEvents).toEqual([expect.objectContaining({version:6,fromStatus:'OPEN',toStatus:'RESOLVED'})]);
      await expect(db.ticketWorkflowEvent.delete({where:{id:saved.workflowEvents[0].id}})).rejects.toThrow();
    }else{expect(saved.currentStatus).toBe('OPEN');expect(saved.actions.some(a=>a.status==='PLANNED')).toBe(true);}
    console.log('CONCURRENCY_API_PROOF',JSON.stringify({case:'Resolve-vs-Action',statuses:responses.map(r=>r.status),finalStatus:saved.currentStatus,version:saved.version}));
  });
  it('retains work/events on forbidden deletion and safely hides unexpected backend errors',async()=>{
    const t=await ticket();const a=(await create(t.id)).body.action;
    expect((await request(app).delete(`/staff/tickets/${t.id}/actions/${a.id}`).set('Cookie',staff)).status).toBe(404);
    await expect(db.actionTaken.delete({where:{id:a.id}})).rejects.toThrow();
    const event=await db.actionEvent.findFirstOrThrow({where:{actionId:a.id}});
    await expect(db.actionEvent.update({where:{id:event.id},data:{changes:{}}})).rejects.toThrow();
    expect(await db.actionTaken.count({where:{id:a.id}})).toBe(1);
    const outage=vi.spyOn(db,'$transaction').mockRejectedValueOnce(new Error('PRIVATE_DATABASE_PASSWORD_SENTINEL'));
    try{
      const response=await request(app).get(`/staff/tickets/${t.id}/actions`).set('Cookie',staff);
      expect(response.status).toBe(500);expect(JSON.stringify(response.body)).not.toContain('PRIVATE_DATABASE_PASSWORD_SENTINEL');
    }finally{outage.mockRestore();}
  });
  it('scopes the same retry key separately by actor and Ticket',async()=>{
    const first=await ticket(),second=await ticket(),key=randomUUID();
    expect((await create(first.id,input(),key)).status).toBe(201);
    expect((await create(second.id,input(),key)).status).toBe(201);
    expect((await create(first.id,input(2),key,admin)).status).toBe(201);
    expect(await db.idempotencyRecord.count({where:{key}})).toBe(3);
  });
});
