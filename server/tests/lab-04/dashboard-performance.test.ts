import { createHash,randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import os from 'node:os';
import request from 'supertest';
import { describe,it,expect,vi } from 'vitest';
import { app } from '../../src/app.js';
import { getPrisma } from '../../src/prisma.js';
import { newDatabase,prismaCommand,sql } from './database-fixture.js';

describe.skipIf(process.env.LAB4_PERF_TEST!=='1')('PERF-01 isolated 10k Tickets /20k Actions smoke',()=>{
  it('measures real authorized dashboards, fixed query work and query plans',async()=>{
    const url=newDatabase('perf');prismaCommand(url,['migrate','deploy']);process.env.DATABASE_URL=url;const db=getPrisma();
    try{
      const category=await db.category.create({data:{name:'Synthetic performance'}}),system=await db.relatedSystem.create({data:{name:'Performance fixture'}});
      const legacy=await db.developmentRequester.create({data:{displayName:'Perf Owner',email:'perf-owner@example.test'}});
      const owner=await db.user.create({data:{name:'Perf Owner',email:legacy.email,developmentRequesterId:legacy.id,passwordHash:'NO_PASSWORD_LOGIN',role:'REQUESTER',mustChangePassword:false}});
      const staff=await db.user.create({data:{name:'Perf Staff',email:'perf-staff@example.test',passwordHash:'NO_PASSWORD_LOGIN',role:'IT_STAFF',mustChangePassword:false}});
      const admin=await db.user.create({data:{name:'Perf Admin',email:'perf-admin@example.test',passwordHash:'NO_PASSWORD_LOGIN',role:'ADMINISTRATOR',mustChangePassword:false}});
      // Direct, explicitly synthetic bulk fixture. These are not fabricated claims
      // that twenty thousand work operations were exercised through the API.
      sql(url,`INSERT INTO "Ticket" ("ticketNumber","requesterId","requesterUserId","categoryId","relatedSystemId",summary,description,"requestedPriority","currentStatus","itPriority","ownerUserId",version,"createdAt","updatedAt","lastResolvedAt")
        SELECT 'TKT-PERF-'||g,${legacy.id},${owner.id},${category.id},${system.id},'Synthetic performance Ticket '||g,'Not service data','MEDIUM',
        (ARRAY['NEW','OPEN','IN_PROGRESS','WAITING_FOR_REQUESTER','RESOLVED','CLOSED','REOPENED','CANCELLED'])[1+(g%8)]::"TicketStatus",
        (ARRAY['NOT_SET','LOW','MEDIUM','HIGH','URGENT'])[1+(g%5)]::"ITPriority",CASE WHEN g%2=0 THEN ${staff.id} ELSE NULL END,3,NOW()-INTERVAL '1 day',NOW(),CASE WHEN g%8 IN(4,5) THEN NOW()-INTERVAL '1 hour' ELSE NULL END FROM generate_series(1,10000) g;
        INSERT INTO "ActionTaken" ("ticketId","performedByUserId","assigneeUserId","actionDateTime",description,result,status,"updatedAt")
        SELECT t.id,${staff.id},${admin.id},NOW(),'Synthetic work '||n,'Synthetic verified','COMPLETED',NOW() FROM "Ticket" t CROSS JOIN generate_series(1,2) n;
        INSERT INTO "ActionEvent" ("actionId","ticketId","actorId",type,version,changes) SELECT id,"ticketId",${staff.id},'CREATED',1,'{"syntheticPerformanceFixture":true}'::jsonb FROM "ActionTaken";
        ANALYZE "Ticket"; ANALYZE "ActionTaken";`);
      expect(await db.ticket.count()).toBe(10000);expect(await db.actionTaken.count()).toBe(20000);
      console.log('PERF_ENV',JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemoryGB:Math.round(os.totalmem()/1024**3),postgres:'dedicated loopback55484',database:new URL(url).pathname,warmup:5,samples:20,tickets:10000,actions:20000,limitMs:1000}));
      const counts:number[]=[];const transaction=db.$transaction.bind(db);
      const tracing=vi.spyOn(db,'$transaction').mockImplementation(((fn:any,options:any)=>transaction(async(tx:any)=>{
        let operations=0;const proxy=new Proxy(tx,{get(target,key){const model=Reflect.get(target,key);if(!['ticket','authSession','actionTaken'].includes(String(key)))return model;return new Proxy(model,{get(m,method){const value=Reflect.get(m,method);return typeof value==='function'?(...args:any[])=>{operations++;return value.apply(m,args);}:value;}});}});
        try{return await fn(proxy);}finally{counts.push(operations);}
      },options)) as any);
      for(const [role,user,path]of [['REQUESTER',owner,'/api/tickets/dashboard'],['IT_STAFF',staff,'/staff/dashboard'],['ADMINISTRATOR',admin,'/staff/dashboard']] as const){
        const token=randomBytes(32).toString('base64url');await db.authSession.create({data:{userId:user.id,tokenHash:createHash('sha256').update(token).digest('hex'),expiresAt:new Date(Date.now()+3600000)}});
        const run=()=>request(app).get(path).set('Cookie','toktickit_session='+token);for(let i=0;i<5;i++)expect((await run()).status).toBe(200);
        counts.length=0;const times:number[]=[];let last:any;for(let i=0;i<20;i++){const start=performance.now();last=await run();times.push(performance.now()-start);expect(last.status).toBe(200);expect(last.body.recentTickets.length).toBeLessThanOrEqual(5);}
        const sorted=[...times].sort((a,b)=>a-b),p95=sorted[Math.ceil(sorted.length*.95)-1];
        console.log('PERF_RESULT',JSON.stringify({role,path,timesMs:times.map(n=>+n.toFixed(2)),p95Ms:+p95.toFixed(2),maxMs:+Math.max(...times).toFixed(2),transactionModelOperations:counts,responseBytes:Buffer.byteLength(JSON.stringify(last.body)),myActions:last.body.metrics.myActions}));expect(p95).toBeLessThanOrEqual(1000);expect(counts).toHaveLength(20);expect(new Set(counts).size).toBe(1);expect(counts[0]).toBeLessThanOrEqual(12);
      }
      tracing.mockRestore(); // Model-call count excludes outer auth middleware and SQL BEGIN/COMMIT.
      // Actual PostgreSQL plans, including rows/buffers/timing. Full aggregates
      // may rationally use sequential scans; do not label that alone a defect.
      for(const query of [
        `SELECT "currentStatus",count(*) FROM "Ticket" GROUP BY "currentStatus"`,
        `SELECT id FROM "Ticket" WHERE "requesterUserId"=${owner.id} ORDER BY "updatedAt" DESC,id DESC LIMIT 5`,
        `SELECT id FROM "ActionTaken" WHERE "performedByUserId"=${staff.id} ORDER BY "createdAt" DESC,id DESC LIMIT 5`,
      ])console.log('PERF_EXPLAIN',query,'\n'+sql(url,'EXPLAIN (ANALYZE,BUFFERS,FORMAT TEXT) '+query));
    }finally{await db.$disconnect();}
  },120000);
});
