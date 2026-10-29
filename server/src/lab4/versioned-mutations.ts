import { ActionEventType, ActionStatus, Prisma, PrismaClient, TicketStatus } from '@prisma/client';

/** Internal persistence primitives only. NOT routes, authorization or workflow policy.
 * Phase 3/4 must authenticate and validate policy inside the locked transaction
 * via the policy callback before exposing a write. Never call raw model writes
 * from an API instead of this protocol. SQL uniqueness alone is NOT this guarantee.
 */
export class MutationConflict extends Error {
  constructor(public readonly code: 'STALE_VERSION' | 'HISTORY_INTEGRITY' | 'INVALID_MUTATION') {
    super(code);
  }
}
interface ParentCommand { ticketId: number; actorId: number; expectedTicketVersion: number }
type Policy = (tx: Prisma.TransactionClient, ticket: { id: number; currentStatus: TicketStatus; version: number }) => Promise<void>;
type Database = PrismaClient | Prisma.TransactionClient;
function transaction<T>(db: Database, write: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  // A caller may compose replay records and domain policy into this SAME outer
  // interactive transaction. Do not open a second, independently committing one.
  return '$transaction' in db ? db.$transaction(write) : write(db);
}
type ActionData = {
  assigneeUserId: number; actionDateTime: Date; description: string; result: string;
  followUpRequired: boolean; followUpNote: string; attachmentNotes: string;
};
type ActionPatch = Partial<ActionData & { status: ActionStatus }>;
const createKeys = ['assigneeUserId', 'actionDateTime', 'description', 'result', 'followUpRequired', 'followUpNote', 'attachmentNotes'];
const patchKeys = [...createKeys, 'status'];

function keys(value: object, allowed: string[], required: string[] = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(key => !allowed.includes(key))
      || required.some(key => !(key in value))) throw new MutationConflict('INVALID_MUTATION');
}
function command(value: ParentCommand, extra: string[]) {
  keys(value, ['ticketId', 'actorId', 'expectedTicketVersion', ...extra], ['ticketId', 'actorId', 'expectedTicketVersion', ...extra]);
  for (const number of [value.ticketId, value.actorId, value.expectedTicketVersion]) {
    if (!Number.isSafeInteger(number) || number < 1) throw new MutationConflict('INVALID_MUTATION');
  }
}
function json(value: unknown): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject;
}

// CAS takes the parent row lock FIRST for every writer, so concurrent Action and
// workflow writes cannot both succeed with the same parent precondition. Throwing
// anywhere below rolls back this increment along with all entity/event changes.
async function lockParent(tx: Prisma.TransactionClient, args: ParentCommand) {
  const updated = await tx.ticket.updateMany({ where: { id: args.ticketId, version: args.expectedTicketVersion },
    data: { version: { increment: 1 } } });
  if (updated.count !== 1) throw new MutationConflict('STALE_VERSION');
  const ticket = await tx.ticket.findUniqueOrThrow({ where: { id: args.ticketId } });
  const events = await tx.ticketWorkflowEvent.findMany({ where: { ticketId: args.ticketId }, orderBy: { id: 'asc' } });
  let previousVersion = 1;
  let previousStatus: TicketStatus | undefined;
  for (const event of events) {
    // Workflow-only events may have gaps: Action mutations also bump Ticket.version.
    if (event.version <= previousVersion || event.version > args.expectedTicketVersion
        || (previousStatus !== undefined && event.fromStatus !== previousStatus)) {
      throw new MutationConflict('HISTORY_INTEGRITY');
    }
    previousVersion = event.version;
    previousStatus = event.toStatus;
  }
  if (previousStatus !== undefined && previousStatus !== ticket.currentStatus) throw new MutationConflict('HISTORY_INTEGRITY');
  return ticket;
}

/** A required trusted policy runs under the shared parent lock, not before it.
 * Test/seed callers may pass an explicit no-op for synthetic persistence tests;
 * that is not evidence of authorization, business-rule or Resolve-gate enforcement.
 */
export async function createActionWithHistory(prisma: Database,
  args: ParentCommand & { data: ActionData }, policy: Policy = denyUnvalidatedMutation) {
  command(args, ['data']);
  keys(args.data, createKeys, createKeys);
  return transaction(prisma, async tx => {
    const ticket = await lockParent(tx, args);
    await policy(tx, { ...ticket, version: args.expectedTicketVersion });
    const action = await tx.actionTaken.create({ data: { ...args.data, ticketId: args.ticketId,
      performedByUserId: args.actorId, status: 'PLANNED', version: 1 } });
    await tx.actionEvent.create({ data: { actionId: action.id, ticketId: args.ticketId, actorId: args.actorId,
      type: 'CREATED', version: action.version, changes: json({ ...args.data, status: action.status }) } });
    return action;
  });
}

export async function updateActionWithHistory(prisma: Database,
  args: ParentCommand & { actionId: number; expectedVersion: number; data: ActionPatch }, policy: Policy = denyUnvalidatedMutation) {
  command(args, ['actionId', 'expectedVersion', 'data']);
  if (![args.actionId, args.expectedVersion].every(value => Number.isSafeInteger(value) && value > 0)) throw new MutationConflict('INVALID_MUTATION');
  keys(args.data, patchKeys);
  if (!Object.keys(args.data).length || Object.values(args.data).some(value => value === undefined)) throw new MutationConflict('INVALID_MUTATION');
  return transaction(prisma, async tx => {
    const ticket = await lockParent(tx, args);
    await policy(tx, { ...ticket, version: args.expectedTicketVersion });
    const before = await tx.actionTaken.findFirst({ where: { id: args.actionId, ticketId: args.ticketId, version: args.expectedVersion } });
    if (!before) throw new MutationConflict('STALE_VERSION');
    const history = await tx.actionEvent.findMany({ where: { actionId: before.id }, orderBy: { id: 'asc' } });
    if (history.length !== before.version || history.some((event, index) => event.version !== index + 1
        || event.ticketId !== args.ticketId || (index === 0 ? event.type !== 'CREATED' : event.type === 'CREATED'))) {
      throw new MutationConflict('HISTORY_INTEGRITY');
    }
    const updated = await tx.actionTaken.updateMany({ where: { id: before.id, ticketId: args.ticketId, version: args.expectedVersion },
      data: { ...args.data, version: { increment: 1 } } });
    if (updated.count !== 1) throw new MutationConflict('STALE_VERSION');
    const action = await tx.actionTaken.findUniqueOrThrow({ where: { id: before.id } });
    const changes = Object.fromEntries(Object.keys(args.data).map(key => [key, {
      before: before[key as keyof ActionPatch], after: action[key as keyof ActionPatch],
    }]));
    const type: ActionEventType = 'status' in args.data ? 'STATUS_CHANGED' : 'assigneeUserId' in args.data ? 'ASSIGNED' : 'UPDATED';
    await tx.actionEvent.create({ data: { actionId: action.id, ticketId: args.ticketId, actorId: args.actorId,
      type, version: action.version, changes: json(changes) } });
    return action;
  });
}

export async function transitionTicketWithHistory(prisma: Database,
  args: ParentCommand & { toStatus: TicketStatus }, policy: Policy = denyUnvalidatedMutation) {
  command(args, ['toStatus']);
  if (!Object.values(TicketStatus).includes(args.toStatus)) throw new MutationConflict('INVALID_MUTATION');
  return transaction(prisma, async tx => {
    const ticket = await lockParent(tx, args);
    if (ticket.currentStatus === args.toStatus) throw new MutationConflict('INVALID_MUTATION');
    await policy(tx, { ...ticket, version: args.expectedTicketVersion });
    const result = await tx.ticket.update({ where: { id: ticket.id }, data: { currentStatus: args.toStatus,
      ...(args.toStatus === 'RESOLVED' ? { lastResolvedAt: new Date() } : {}) } });
    await tx.ticketWorkflowEvent.create({ data: { ticketId: ticket.id, actorId: args.actorId,
      fromStatus: ticket.currentStatus, toStatus: args.toStatus, version: result.version } });
    return result;
  });
}

async function denyUnvalidatedMutation(): Promise<never> {
  throw new MutationConflict('INVALID_MUTATION');
}
