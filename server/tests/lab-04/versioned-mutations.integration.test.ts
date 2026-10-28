import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newDatabase, prismaCommand, runSeed } from './database-fixture.js';
import { createActionWithHistory as persistCreate, updateActionWithHistory as persistUpdate,
  transitionTicketWithHistory as persistTransition } from '../../src/lab4/versioned-mutations.js';

// Explicit synthetic-test policy, never exported by product code or wired to HTTP.
const syntheticPolicy = async () => {};
const createActionWithHistory = (db: PrismaClient, args: Parameters<typeof persistCreate>[1]) => persistCreate(db, args, syntheticPolicy);
const updateActionWithHistory = (db: PrismaClient, args: Parameters<typeof persistUpdate>[1]) => persistUpdate(db, args, syntheticPolicy);
const transitionTicketWithHistory = (db: PrismaClient, args: Parameters<typeof persistTransition>[1]) => persistTransition(db, args, syntheticPolicy);

// Internal transaction protocol tests, NOT HTTP/authorization/Resolve-gate tests.
describe.skipIf(!process.env.LAB4_TEST_ADMIN_URL)('VERSION-01: atomic parent/entity/history protocol', () => {
  let prisma: PrismaClient;
  let actorId: number;
  let sequence = 0;
  beforeAll(async () => {
    const url = newDatabase('versions');
    prismaCommand(url, ['migrate', 'deploy']);
    runSeed(url);
    prisma = new PrismaClient({ datasources: { db: { url } } });
    actorId = (await prisma.user.findUniqueOrThrow({ where: { email: 'iris.nattapong@example.test' } })).id;
  }, 120_000);
  afterAll(async () => { if (prisma) await prisma.$disconnect(); });

  async function fixture() {
    const source = await prisma.ticket.findFirstOrThrow({ where: { currentStatus: 'NEW' } });
    const ticket = await prisma.ticket.create({ data: {
      ticketNumber: `TKT-VERSION-${++sequence}`, requesterId: source.requesterId,
      requesterUserId: source.requesterUserId, categoryId: source.categoryId,
      relatedSystemId: source.relatedSystemId, ownerUserId: actorId,
      summary: 'Isolated version protocol fixture', description: 'Synthetic test only',
      requestedPriority: 'MEDIUM', currentStatus: 'OPEN',
    } });
    return { ticketId: ticket.id, actorId, expectedTicketVersion: 1 };
  }
  function input() {
    return { assigneeUserId: actorId, actionDateTime: new Date(), description: 'Synthetic work',
      result: '', followUpRequired: false, followUpNote: '', attachmentNotes: '' };
  }
  async function saved(ticketId: number) {
    return prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: {
      actions: { orderBy: { id: 'asc' }, include: { events: { orderBy: { id: 'asc' } } } },
      workflowEvents: { orderBy: { id: 'asc' } },
    } });
  }

  it('commits a Ticket transition and its matching version/from/to event together', async () => {
    const args = await fixture();
    const result = await transitionTicketWithHistory(prisma, { ...args, toStatus: 'IN_PROGRESS' });
    expect(result.version).toBe(2);
    const record = await saved(args.ticketId);
    expect(record.currentStatus).toBe('IN_PROGRESS');
    expect(record.workflowEvents).toEqual([expect.objectContaining({ version: 2, fromStatus: 'OPEN', toStatus: 'IN_PROGRESS', actorId })]);
  });
  it('rejects stale Ticket writes without an extra event or state change', async () => {
    const args = await fixture();
    await transitionTicketWithHistory(prisma, { ...args, toStatus: 'IN_PROGRESS' });
    const before = await saved(args.ticketId);
    await expect(transitionTicketWithHistory(prisma, { ...args, toStatus: 'WAITING_FOR_REQUESTER' })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(await saved(args.ticketId)).toEqual(before);
  });
  it('rejects caller-supplied/skipped event versions rather than accepting version 99', async () => {
    const args = await fixture();
    await expect(transitionTicketWithHistory(prisma, { ...args, toStatus: 'IN_PROGRESS', version: 99 } as never)).rejects.toMatchObject({ code: 'INVALID_MUTATION' });
    expect((await saved(args.ticketId)).version).toBe(1);
  });
  it('rolls back Ticket state/version when workflow-event insertion fails', async () => {
    const args = await fixture();
    const before = await saved(args.ticketId);
    await expect(transitionTicketWithHistory(prisma, { ...args, actorId: 2147483647, toStatus: 'IN_PROGRESS' })).rejects.toThrow();
    expect(await saved(args.ticketId)).toEqual(before);
  });
  it('creates an Action at version 1 with CREATED history and one parent bump', async () => {
    const args = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    const record = await saved(args.ticketId);
    expect(record.version).toBe(2);
    expect(record.actions[0]).toMatchObject({ id: action.id, version: 1, performedByUserId: actorId });
    expect(record.actions[0].events).toEqual([expect.objectContaining({ type: 'CREATED', version: 1 })]);
  });
  it('appends exactly one ordered Action event per increment and shares parent versions', async () => {
    const args = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    for (const expectedVersion of [1, 2]) {
      await updateActionWithHistory(prisma, { ...args, actionId: action.id,
        expectedTicketVersion: expectedVersion + 1, expectedVersion, data: { description: `Revision ${expectedVersion}` } });
    }
    const record = await saved(args.ticketId);
    expect(record.version).toBe(4);
    expect(record.actions[0].version).toBe(3);
    expect(record.actions[0].events.map(event => event.version)).toEqual([1, 2, 3]);
    expect(record.actions[0].events[1].changes).toMatchObject({ description: { before: 'Synthetic work', after: 'Revision 1' } });
    // Workflow versions use the shared Ticket sequence; Action writes occupy 2..4.
    await transitionTicketWithHistory(prisma, { ...args, expectedTicketVersion: 4, toStatus: 'IN_PROGRESS' });
    expect((await saved(args.ticketId)).workflowEvents.map(event => event.version)).toEqual([5]);
  });
  it('rejects stale Action versions and wrong parents with full transaction rollback', async () => {
    const args = await fixture();
    const other = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    const before = await saved(args.ticketId);
    await expect(updateActionWithHistory(prisma, { ...args, actionId: action.id, expectedTicketVersion: 2,
      expectedVersion: 99, data: { description: 'Must not persist' } })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(await saved(args.ticketId)).toEqual(before);
    await expect(updateActionWithHistory(prisma, { ...other, actionId: action.id, expectedVersion: 1,
      data: { description: 'Wrong parent' } })).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect((await saved(other.ticketId)).version).toBe(1);
  });
  it('rolls back Action changes and parent version when event insertion fails', async () => {
    const args = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    const before = await saved(args.ticketId);
    await expect(updateActionWithHistory(prisma, { ...args, actionId: action.id, actorId: 2147483647,
      expectedTicketVersion: 2, expectedVersion: 1, data: { description: 'Must roll back' } })).rejects.toThrow();
    expect(await saved(args.ticketId)).toEqual(before);
  });
  it('allows only one concurrent Action writer for the same expected versions', async () => {
    const args = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    const writes = await Promise.allSettled(['Writer A', 'Writer B'].map(description => updateActionWithHistory(prisma,
      { ...args, actionId: action.id, expectedTicketVersion: 2, expectedVersion: 1, data: { description } })));
    expect(writes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(writes.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'STALE_VERSION' } });
    const record = await saved(args.ticketId);
    expect(record.version).toBe(3);
    expect(record.actions[0].events.map(event => event.version)).toEqual([1, 2]);
  });
  it('serializes competing Action and Ticket writes on the shared parent version', async () => {
    const args = await fixture();
    const writes = await Promise.allSettled([
      createActionWithHistory(prisma, { ...args, data: input() }),
      transitionTicketWithHistory(prisma, { ...args, toStatus: 'IN_PROGRESS' }),
    ]);
    expect(writes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(writes.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: 'STALE_VERSION' } });
    const record = await saved(args.ticketId);
    expect(record.version).toBe(2);
    expect(record.actions.length + record.workflowEvents.length).toBe(1);
  });
  it('refuses mutation of Actions with missing, skipped or out-of-insertion-order history', async () => {
    for (const versions of [[], [99], [2, 1]]) {
      const args = await fixture();
      // Deliberate raw SQL/ORM corruption: SQL uniqueness alone is not the protocol.
      const action = await prisma.actionTaken.create({ data: { ...input(), ticketId: args.ticketId,
        performedByUserId: actorId, version: versions.length === 2 ? 2 : 1 } });
      for (const version of versions) await prisma.actionEvent.create({ data: { actionId: action.id,
        ticketId: args.ticketId, actorId, type: version === 1 ? 'CREATED' : 'UPDATED', version, changes: {} } });
      const before = await saved(args.ticketId);
      await expect(updateActionWithHistory(prisma, { ...args, actionId: action.id,
        expectedVersion: action.version, data: { description: 'Blocked corrupt history' } })).rejects.toMatchObject({ code: 'HISTORY_INTEGRITY' });
      expect(await saved(args.ticketId)).toEqual(before);
    }
  });
  it('rejects corrupt workflow history before writing another transition', async () => {
    const args = await fixture();
    await prisma.ticketWorkflowEvent.create({ data: { ticketId: args.ticketId, actorId,
      fromStatus: 'NEW', toStatus: 'OPEN', version: 99 } });
    const before = await saved(args.ticketId);
    await expect(transitionTicketWithHistory(prisma, { ...args, toStatus: 'IN_PROGRESS' })).rejects.toMatchObject({ code: 'HISTORY_INTEGRITY' });
    expect(await saved(args.ticketId)).toEqual(before);
  });
  it('rejects Action version spoofing and empty mutations without creating history', async () => {
    const args = await fixture();
    const action = await createActionWithHistory(prisma, { ...args, data: input() });
    const before = await saved(args.ticketId);
    for (const data of [{ version: 99 }, {}]) {
      await expect(updateActionWithHistory(prisma, { ...args, actionId: action.id,
        expectedTicketVersion: 2, expectedVersion: 1, data } as never)).rejects.toMatchObject({ code: 'INVALID_MUTATION' });
    }
    expect(await saved(args.ticketId)).toEqual(before);
  });
  it('fails closed without explicit policy and rolls back a failed policy inside the lock', async () => {
    const args = await fixture();
    const before = await saved(args.ticketId);
    await expect(persistCreate(prisma, { ...args, data: input() })).rejects.toMatchObject({ code: 'INVALID_MUTATION' });
    await expect(persistTransition(prisma, { ...args, toStatus: 'IN_PROGRESS' })).rejects.toMatchObject({ code: 'INVALID_MUTATION' });
    await expect(persistCreate(prisma, { ...args, data: input() }, async (tx, ticket) => {
      expect(ticket.version).toBe(1);
      expect((await tx.ticket.findUniqueOrThrow({ where: { id: args.ticketId } })).version).toBe(2);
      throw new Error('Synthetic policy rejection');
    })).rejects.toThrow('Synthetic policy rejection');
    expect(await saved(args.ticketId)).toEqual(before);
  });
});
