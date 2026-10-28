import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { applySqlMigrations, backup, newDatabase, pg, snapshot, sql } from './database-fixture.js';

describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('MIG-01: populated Lab3 upgrade and recovery on isolated PostgreSQL', () => {
  let source: string;
  let before: ReturnType<typeof snapshot>;
  let dump: string;
  let prisma: PrismaClient;
  beforeAll(() => {
    source = newDatabase('migration');
    applySqlMigrations(source, false);
    sql(source, `
      INSERT INTO "Category" (id,name) VALUES (90001,'Legacy category');
      INSERT INTO "RelatedSystem" (id,name,"updatedAt") VALUES (90001,'Legacy system',now());
      INSERT INTO "DevelopmentRequester" (id,"displayName",email,"updatedAt") VALUES (90001,'Synthetic legacy','legacy@fixture.test',now());
      INSERT INTO "User" (id,name,email,"passwordHash",role,"developmentRequesterId","updatedAt") VALUES
        (90001,'Synthetic requester','requester@fixture.test','synthetic-retained-hash','REQUESTER',90001,now()),
        (90002,'Synthetic staff','staff@fixture.test','synthetic-staff-hash','IT_STAFF',NULL,now());
      INSERT INTO "Ticket" (id,"ticketNumber","requesterId","requesterUserId","ownerUserId","categoryId","relatedSystemId",summary,description,"requestedPriority","currentStatus","updatedAt") VALUES
        (90001,'LEGACY-RESOLVED',90001,90001,90002,90001,90001,'Legacy resolved','Keep exact data','HIGH','RESOLVED',now()),
        (90002,'LEGACY-CLOSED',90001,90001,90002,90001,90001,'Legacy closed','Keep exact data','LOW','CLOSED',now()),
        (90003,'LEGACY-OPEN',90001,90001,NULL,90001,90001,'Legacy unassigned','Keep exact data','MEDIUM','OPEN',now());
      INSERT INTO "Attachment" ("ticketId","originalFilename","storageKey","mimeType","byteSize") VALUES (90001,'synthetic.txt','synthetic/live','text/plain',4);
      INSERT INTO "Attachment" ("ticketId","originalFilename","storageKey","mimeType","byteSize","removedAt","removalReason","removedByRequesterId","removedByUserId") VALUES (90002,'removed.txt','synthetic/removed','text/plain',4,now(),'Synthetic removal',90001,90001);
      INSERT INTO "PublicComment" ("ticketId","authorId",content) VALUES (90001,90001,'Synthetic shared history');
      INSERT INTO "InternalNote" ("ticketId","authorId",content) VALUES (90001,90002,'Synthetic private history');
      INSERT INTO "AuthSession" ("tokenHash","userId","expiresAt") VALUES ('synthetic-fixture-not-a-real-token',90001,now()+interval '1 day');
    `);
    before = snapshot(source);
    dump = backup(source);
    pg('psql', ['-X','--set=ON_ERROR_STOP=1','--dbname',source,'-f',
      resolve('prisma/migrations/20261028070000_lab4_action_foundation/migration.sql')]);
    prisma = new PrismaClient({ datasources: { db: { url: source } } });
  }, 120_000);
  afterAll(async () => { if (prisma) await prisma.$disconnect(); });

  it('preserves every existing field/ID/relationship in all nine tables', () => {
    expect(snapshot(source, undefined, true)).toEqual(before);
  });
  it('keeps legacy zero-Action and unknown resolution timestamps truthful', async () => {
    const tickets = await prisma.ticket.findMany({ include: { actions: true } });
    expect(tickets).toHaveLength(3);
    expect(tickets.every(t => t.version === 1 && t.lastResolvedAt === null && t.actions.length === 0)).toBe(true);
    expect(await prisma.actionEvent.count()).toBe(0);
    expect(await prisma.ticketWorkflowEvent.count()).toBe(0);
  });
  it('restores the pre-upgrade backup into another fresh database with exact equality', () => {
    const restored = newDatabase('recovery');
    pg('pg_restore', ['--exit-on-error','--no-owner','--dbname',restored,dump]);
    expect(snapshot(restored)).toEqual(before);
    expect(sql(restored, `SELECT to_regclass('public."ActionTaken"') IS NULL`)).toBe('t');
    console.log('MIG-01 PASS: exact nine-table equality, legacy zero-Action/NULL resolution, separate-database pg_dump/pg_restore recovery.');
  }, 60_000);
});
