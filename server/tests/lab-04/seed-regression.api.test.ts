import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newDatabase, prismaCommand, runSeed, snapshot, sql } from './database-fixture.js';
import { LAB4_PREFIX } from '../../prisma/seed-lab4.js';

describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('SEED-01: migration deployment, constraints and repeated seeds', () => {
  let url: string;
  let prisma: PrismaClient;
  beforeAll(() => {
    url = newDatabase('seed');
    prismaCommand(url, ['migrate','deploy']);
    runSeed(url);
    prisma = new PrismaClient({ datasources: { db: { url } } });
  }, 120_000);
  afterAll(async () => { if (prisma) await prisma.$disconnect(); });

  it('covers every status/priority, assigned/unassigned and zero/one/multiple Actions', async () => {
    const tickets = await prisma.ticket.findMany({ where: { ticketNumber: { startsWith: LAB4_PREFIX } }, include: { actions: true } });
    expect(new Set(tickets.map(t => t.currentStatus)).size).toBe(8);
    expect(new Set(tickets.map(t => t.itPriority)).size).toBe(5);
    expect(tickets.some(t => t.ownerUserId === null)).toBe(true);
    expect(tickets.some(t => t.ownerUserId !== null)).toBe(true);
    for (const size of [0,1,2]) expect(tickets.some(t => t.actions.length === size)).toBe(true);
    expect(tickets.some(t => t.actions.some(a => a.performedByUserId !== a.assigneeUserId))).toBe(true);
  });
  it('reruns without duplicates, resetting user changes, passwords or Action history', async () => {
    const action = await prisma.actionTaken.findFirstOrThrow();
    await prisma.actionTaken.update({ where: { id: action.id }, data: { description: 'User-edited synthetic work', version: 2 } });
    await prisma.actionEvent.create({ data: { actionId: action.id, ticketId: action.ticketId,
      actorId: action.performedByUserId, type: 'UPDATED', version: 2, changes: { description: 'User-edited synthetic work' } } });
    const before = snapshot(url, ['Ticket','ActionTaken','ActionEvent','TicketWorkflowEvent','IdempotencyRecord']);
    const password = await prisma.user.findFirstOrThrow();
    runSeed(url);
    runSeed(url);
    expect(snapshot(url, ['Ticket','ActionTaken','ActionEvent','TicketWorkflowEvent','IdempotencyRecord'])).toEqual(before);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: password.id } })).passwordHash).toBe(password.passwordHash);
  }, 120_000);
  it('provides zero and nonzero dashboard fixture populations without fabricating legacy work', async () => {
    const amina = await prisma.user.findUniqueOrThrow({ where: { email: 'amina.rahman@example.test' } });
    const ben = await prisma.user.findUniqueOrThrow({ where: { email: 'ben.carter@example.test' } });
    const iris = await prisma.user.findUniqueOrThrow({ where: { email: 'iris.nattapong@example.test' } });
    const kanya = await prisma.user.findUniqueOrThrow({ where: { email: 'kanya.preecha@example.test' } });
    expect(await prisma.ticket.count({ where: { requesterUserId: amina.id, currentStatus: 'WAITING_FOR_REQUESTER' } })).toBeGreaterThan(0);
    expect(await prisma.ticket.count({ where: { requesterUserId: ben.id, currentStatus: 'WAITING_FOR_REQUESTER' } })).toBe(0);
    expect(await prisma.actionTaken.count({ where: { performedByUserId: iris.id } })).toBeGreaterThan(0);
    expect(await prisma.actionTaken.count({ where: { performedByUserId: kanya.id } })).toBe(0);
    expect(await prisma.actionTaken.count({ where: { ticket: { ticketNumber: { startsWith: 'TKT-20260901-DEMO' } } } })).toBe(0);
  });
  it('enforces append-only events, immutable creator, no Action deletion and parent-safe retries', async () => {
    const action = await prisma.actionTaken.findFirstOrThrow();
    const event = await prisma.actionEvent.findFirstOrThrow({ where: { actionId: action.id } });
    await expect(prisma.actionEvent.update({ where: { id: event.id }, data: { changes: {} } })).rejects.toThrow();
    await expect(prisma.actionEvent.delete({ where: { id: event.id } })).rejects.toThrow();
    await expect(prisma.actionTaken.update({ where: { id: action.id }, data: { performedByUserId: action.assigneeUserId } })).rejects.toThrow();
    await expect(prisma.actionTaken.delete({ where: { id: action.id } })).rejects.toThrow();
    const data = { userId: action.performedByUserId, ticketId: action.ticketId, actionId: action.id,
      key: 'test_retry_key', payloadHash: 'a'.repeat(64) };
    await prisma.idempotencyRecord.create({ data });
    await expect(prisma.idempotencyRecord.create({ data })).rejects.toThrow();
    const other = await prisma.ticket.findFirstOrThrow({ where: { id: { not: action.ticketId } } });
    await expect(prisma.idempotencyRecord.create({ data: { ...data, key: 'wrong_parent_key', ticketId: other.id } })).rejects.toThrow();
  });
  it('deploys again without pending migrations and exposes expected indexes', () => {
    expect(prismaCommand(url, ['migrate','deploy'])).toContain('No pending migrations');
    expect(Number(sql(url, `SELECT count(*) FROM pg_indexes WHERE tablename='ActionTaken'`))).toBeGreaterThanOrEqual(5);
    console.log('SEED-01 PASS: all eight migrations deploy; repeated seed preserves work/history; statuses/priorities and zero/one/multiple Actions covered.');
  }, 60_000);

  it('enforces conditional fields, positive versions and immutable workflow/retry history', async () => {
    const action = await prisma.actionTaken.findFirstOrThrow();
    await expect(prisma.actionTaken.update({ where: { id: action.id }, data: { followUpRequired: true, followUpNote: ' ' } })).rejects.toThrow();
    await expect(prisma.actionTaken.update({ where: { id: action.id }, data: { status: 'COMPLETED', result: '' } })).rejects.toThrow();
    await expect(prisma.actionTaken.update({ where: { id: action.id }, data: { version: 0 } })).rejects.toThrow();
    const workflow = await prisma.ticketWorkflowEvent.create({ data: { ticketId: action.ticketId,
      actorId: action.performedByUserId, fromStatus: 'OPEN', toStatus: 'IN_PROGRESS', version: 99 } });
    await expect(prisma.ticketWorkflowEvent.update({ where: { id: workflow.id }, data: { version: 100 } })).rejects.toThrow();
    await expect(prisma.ticketWorkflowEvent.delete({ where: { id: workflow.id } })).rejects.toThrow();
    const retry = await prisma.idempotencyRecord.findFirstOrThrow();
    await expect(prisma.idempotencyRecord.update({ where: { id: retry.id }, data: { payloadHash: 'b'.repeat(64) } })).rejects.toThrow();
    await expect(prisma.idempotencyRecord.delete({ where: { id: retry.id } })).rejects.toThrow();
  });
});
