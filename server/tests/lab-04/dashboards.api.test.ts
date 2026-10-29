import { createHash,randomBytes,randomUUID } from 'node:crypto';
import request from 'supertest';
import { beforeAll,afterAll,describe,it,expect,vi } from 'vitest';
import { app } from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';
import { newDatabase,prismaCommand } from './database-fixture.js';
describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('Phase6 real dashboard metrics, identity and drill-down',()=>{
  let db:ReturnType<typeof getPrisma>,owner:string,other:string,staff:string,admin:string,inactive:string,first:string;
  let ownerId:number,otherId:number,legacy:number,otherLegacy:number,staffId:number,assignee:number,category:number,system:number;
  const now='2026-10-29T17:00:00.000Z',start='2026-10-23T17:00:00.000Z';
  beforeAll(async()=>{
    const url=newDatabase('dashboards');prismaCommand(url,['migrate','deploy']);process.env.DATABASE_URL=url;db=getPrisma();
    category=(await db.category.create({data:{name:'Synthetic network'}})).id;system=(await db.relatedSystem.create({data:{name:'Synthetic VPN'}})).id;
    async function session(name:string,role:'REQUESTER'|'IT_STAFF'|'ADMINISTRATOR',active=true,mustChange=false){
      const email=`${randomUUID()}@example.test`;const d=role==='REQUESTER'?await db.developmentRequester.create({data:{displayName:name,email,isActive:true}}):null;
      const u=await db.user.create({data:{name,email,passwordHash:'synthetic-no-password-login',role,isActive:active,mustChangePassword:mustChange,developmentRequesterId:d?.id}});
      const token=randomBytes(32).toString('base64url');await db.authSession.create({data:{userId:u.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date('2027-01-01T00:00:00Z')}});return {u,d,cookie:`toktickit_session=${token}`};
    }
    const [o,x,s,a,j,i,f]=await Promise.all([session('Owner','REQUESTER'),session('Other','REQUESTER'),session('Performer','IT_STAFF'),session('Admin','ADMINISTRATOR'),session('Assignee','IT_STAFF'),session('Inactive','IT_STAFF',false),session('First login','IT_STAFF',true,true)]);
    owner=o.cookie;ownerId=o.u.id;legacy=o.d!.id;other=x.cookie;otherId=x.u.id;otherLegacy=x.d!.id;staff=s.cookie;staffId=s.u.id;admin=a.cookie;assignee=j.u.id;inactive=i.cookie;first=f.cookie;
    vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date(now));
  },120000);
  afterAll(async()=>{vi.useRealTimers();if(db)await db.$disconnect();});
  const get=(path:string,cookie=staff)=>request(app).get(path).set('Cookie',cookie);
  async function ticket(status:string='OPEN',extra:Record<string,unknown>={}){return db.ticket.create({data:{ticketNumber:`TKT-P6-${randomUUID()}`,requesterId:legacy,requesterUserId:ownerId,categoryId:category,relatedSystemId:system,summary:'Synthetic dashboard fixture',description:'PRIVATE-DESCRIPTION-SENTINEL',requestedPriority:'MEDIUM',currentStatus:status as any,updatedAt:new Date('2026-10-29T16:00:00Z'),...extra}});}
  it('returns numeric zeros, every enum bucket and empty lists before fixtures exist',async()=>{
    const o=await get('/api/tickets/dashboard',owner),s=await get('/staff/dashboard');expect(o.status).toBe(200);expect(s.status).toBe(200);
    expect(o.body.metrics).toEqual({openTickets:0,waitingTickets:0,recentlyResolvedTickets:0});expect(o.body.recentTickets).toEqual([]);expect(o.body.attentionTickets).toEqual([]);
    expect(Object.keys(s.body.metrics.ticketsByStatus)).toHaveLength(8);expect(Object.values(s.body.metrics.ticketsByStatus)).toEqual(Array(8).fill(0));expect(Object.values(s.body.metrics.openTicketsByPriority)).toEqual(Array(5).fill(0));expect(s.body.recentMyActions).toEqual([]);expect(s.body.urgentTickets).toEqual([]);
    console.log('DASHBOARD_ZERO_PROOF',JSON.stringify({requester:o.body.metrics,staff:s.body.metrics}));
  });
  it('computes exact populations and matches every published drill-down against independent fixture predicates',async()=>{
    const states=['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED','RESOLVED','CLOSED','CANCELLED'];
    for(const [i,state] of states.entries())await ticket(state,{ownerUserId:i%2?staffId:null,itPriority:['NOT_SET','LOW','MEDIUM','HIGH','URGENT'][i%5],...(state==='RESOLVED'?{lastResolvedAt:new Date(start)}:{})});
    await ticket('CLOSED',{lastResolvedAt:new Date(new Date(now).getTime()-1)});
    await ticket('RESOLVED',{lastResolvedAt:new Date(new Date(start).getTime()-1)});await ticket('RESOLVED',{lastResolvedAt:new Date(now)});await ticket('REOPENED',{lastResolvedAt:new Date(start)});
    await ticket('WAITING_FOR_REQUESTER',{requesterId:otherLegacy,requesterUserId:otherId,itPriority:'URGENT'});
    const t=await ticket('OPEN',{ownerUserId:assignee,itPriority:'URGENT'});
    const a=await db.actionTaken.create({data:{ticketId:t.id,performedByUserId:staffId,assigneeUserId:assignee,actionDateTime:new Date('2026-10-29T16:00:00Z'),description:'Performed by current staff, assigned elsewhere. '.repeat(8)}});
    await db.actionEvent.create({data:{ticketId:t.id,actionId:a.id,actorId:staffId,type:'CREATED',version:1,changes:{fixture:true}}});
    const b=await db.actionTaken.create({data:{ticketId:t.id,performedByUserId:assignee,assigneeUserId:staffId,actionDateTime:new Date('2026-10-29T16:00:00Z'),description:'Assigned to current staff but performed elsewhere'}});await db.actionEvent.create({data:{ticketId:t.id,actionId:b.id,actorId:assignee,type:'CREATED',version:1,changes:{fixture:true}}});
    await db.internalNote.create({data:{ticketId:t.id,authorId:staffId,content:'PRIVATE-NOTE-SENTINEL'}});
    const all=await db.ticket.findMany(),openStates=['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','REOPENED'];
    const mine=all.filter(t=>t.requesterUserId===ownerId),open=all.filter(t=>openStates.includes(t.currentStatus));
    const r=(await get('/api/tickets/dashboard',owner)).body,s=(await get('/staff/dashboard')).body;
    expect(r.resolvedWindow).toEqual({start,end:now});expect(r.metrics).toEqual({openTickets:mine.filter(t=>openStates.includes(t.currentStatus)).length,waitingTickets:mine.filter(t=>t.currentStatus==='WAITING_FOR_REQUESTER').length,recentlyResolvedTickets:mine.filter(t=>['RESOLVED','CLOSED'].includes(t.currentStatus)&&t.lastResolvedAt&&t.lastResolvedAt>=new Date(start)&&t.lastResolvedAt<new Date(now)).length});
    expect(s.metrics.unassignedOpenTickets).toBe(open.filter(t=>t.ownerUserId===null).length);expect(s.metrics.myOpenTickets).toBe(open.filter(t=>t.ownerUserId===staffId).length);expect(s.metrics.myActions).toBe(1);
    for(const [status,count] of Object.entries(s.metrics.ticketsByStatus))expect(count).toBe(all.filter(t=>t.currentStatus===status).length);
    for(const [priority,count] of Object.entries(s.metrics.openTicketsByPriority))expect(count).toBe(open.filter(t=>t.itPriority===priority).length);
    for(const [key,path] of Object.entries(r.drillDown)){const list=await get(path as string,owner);expect(list.status).toBe(200);expect(list.body.totalItems).toBe(r.metrics[key]);expect(list.body.items.every((t:any)=>t.requesterUserId===ownerId)).toBe(true);}
    for(const key of ['unassignedOpenTickets','myOpenTickets','myActions']){const list=await get(s.drillDown[key]);expect(list.status).toBe(200);expect(list.body.totalItems).toBe(s.metrics[key]);}
    for(const bucket of ['ticketsByStatus','openTicketsByPriority'])for(const [key,path] of Object.entries(s.drillDown[bucket])){const list=await get(path as string);expect(list.status).toBe(200);expect(list.body.totalItems).toBe(s.metrics[bucket][key]);}
    expect(JSON.stringify([r,s])).not.toMatch(/PRIVATE-DESCRIPTION-SENTINEL|PRIVATE-NOTE-SENTINEL|passwordHash|tokenHash|internalNotes/);
    console.log('DASHBOARD_QUERY_PROOF',JSON.stringify({asOf:r.asOf,window:r.resolvedWindow,requester:r.metrics,staff:s.metrics,allDrillDownCountsMatch:true}));
  });
  it('uses session identity for Requester and current performer, never forged query/header identity',async()=>{
    const x=await get('/api/tickets/dashboard',other);expect(x.body.metrics.waitingTickets).toBe(1);expect(x.body.recentTickets.every((t:any)=>t.summary==='Synthetic dashboard fixture')).toBe(true);
    expect((await get(`/api/tickets/dashboard?requesterId=${ownerId}`,other)).status).toBe(400);
    expect((await request(app).get('/api/tickets/dashboard').set('Cookie',other).set('X-Requester-Id',String(ownerId))).body.metrics).toEqual(x.body.metrics);
    expect((await get('/staff/dashboard',admin)).body.metrics.myActions).toBe(0);
    expect((await get(`/staff/dashboard?performedBy=${staffId}`,admin)).status).toBe(400);
  });
  it('orders recent/attention/urgent/own-work lists with deterministic ties and priority-first urgency',async()=>{
    const r=(await get('/api/tickets/dashboard',owner)).body,s=(await get('/staff/dashboard')).body;
    const recents=await db.ticket.findMany({where:{requesterUserId:ownerId},orderBy:[{updatedAt:'desc'},{id:'desc'}],take:5});expect(r.recentTickets.map((t:any)=>t.id)).toEqual(recents.map(t=>t.id));
    expect(r.attentionTickets.every((t:any)=>t.currentStatus==='WAITING_FOR_REQUESTER')).toBe(true);expect(s.recentMyActions).toHaveLength(1);
    expect(s.recentMyActions[0].description).toHaveLength(160);expect(s.recentMyActions[0].description.endsWith('...')).toBe(true);
    let seenHigh=false;for(const t of s.urgentTickets){expect(['HIGH','URGENT']).toContain(t.itPriority);if(t.itPriority==='HIGH')seenHigh=true;else expect(seenHigh).toBe(false);}expect(s.urgentTickets.length).toBeLessThanOrEqual(5);
  });
  it('guards literal/sibling dashboard routes with auth, role, inactive and first-login rules',async()=>{
    for(const path of ['/api/tickets/dashboard','/staff/dashboard']){expect((await request(app).get(path)).status).toBe(401);expect((await get(path,inactive)).status).toBe(401);expect((await get(path,first)).status).toBe(403);}
    expect((await get('/staff/dashboard',owner)).status).toBe(403);expect((await get('/api/tickets/dashboard',staff)).status).toBe(403);expect((await get('/staff/dashboard',admin)).status).toBe(200);
  });
  it('rejects malformed or contradictory drill-down filters without broadening data access',async()=>{
    for(const suffix of ['statusGroup=bad','statusGroup=open&status=CLOSED','unassigned=true&ownerId=1','priority=INVALID','unassigned=false'])expect((await get('/staff/tickets?'+suffix)).status).toBe(400);
    for(const suffix of ['statusGroup=resolved&resolvedSince=2026-10-01','statusGroup=resolved&resolvedSince=2026-02-30T00:00:00Z&resolvedBefore=2026-03-02T00:00:00Z','statusGroup=open&status=CLOSED'])expect((await get('/api/tickets?'+suffix,owner)).status).toBe(400);
  });
  it('returns safe recoverable500 without private database diagnostics',async()=>{
    const fault=vi.spyOn(db,'$transaction').mockRejectedValueOnce(new Error('PRIVATE-DATABASE-SENTINEL'));try{const r=await get('/staff/dashboard');expect(r.status).toBe(500);expect(JSON.stringify(r.body)).not.toContain('PRIVATE-DATABASE-SENTINEL');}finally{fault.mockRestore();}
  });
});
