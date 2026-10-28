import { ActionStatus, ITPriority, PrismaClient, TicketStatus } from '@prisma/client';

// New, reserved fixtures only: never fabricate work on Lab 1-3 Tickets and never
// reset existing work, passwords, versions, or dates on a repeated seed.
export const LAB4_PREFIX = 'TKT-20261028-L4D';
export async function seedLab4Examples(prisma: PrismaClient) {
  const statuses = Object.values(TicketStatus);
  const priorities = Object.values(ITPriority);
  for (const [index, status] of statuses.entries()) {
    const ticketNumber = `${LAB4_PREFIX}${String(index + 1).padStart(5, '0')}`;
    await prisma.$transaction(async tx => {
      // Serialize concurrent invocations on this fixture; this lock is scoped
      // to the transaction and never used on ordinary user records.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ticketNumber}))`;
      if (await tx.ticket.findUnique({ where: { ticketNumber } })) return;
      const requester = await tx.user.findUniqueOrThrow({ where: { email: 'amina.rahman@example.test' } });
      const performer = await tx.user.findUniqueOrThrow({ where: { email: 'iris.nattapong@example.test' } });
      const assignee = await tx.user.findUniqueOrThrow({ where: { email: 'jonas.miller@example.test' } });
      const category = await tx.category.findUniqueOrThrow({ where: { name: 'Network' } });
      const system = await tx.relatedSystem.findUniqueOrThrow({ where: { name: 'Campus Wi-Fi' } });
      if (!requester.developmentRequesterId) throw new Error('Missing requester migration mapping');
      const createdAt = new Date('2026-10-28T01:00:00.000Z');
      const actionTime = new Date('2026-10-28T02:00:00.000Z');
      const terminal = status === 'RESOLVED' || status === 'CLOSED';
      const actionCount = status === 'NEW' ? 0 : index % 2 + 1;
      const ticket = await tx.ticket.create({ data: {
        ticketNumber, requesterId: requester.developmentRequesterId, requesterUserId: requester.id,
        ownerUserId: status === 'NEW' || status === 'CANCELLED' ? null : performer.id,
        categoryId: category.id, relatedSystemId: system.id,
        summary: `[Lab 4 synthetic] ${status} network support`,
        description: 'Dedicated Lab 4 demonstration fixture; not historical service work.',
        requestedPriority: 'MEDIUM', itPriority: priorities[index % priorities.length],
        currentStatus: status, createdAt,
        lastResolvedAt: terminal ? new Date('2026-10-28T03:00:00.000Z') : null,
        version: actionCount + 1,
      } });
      for (let number = 0; number < actionCount; number++) {
        const actionStatus: ActionStatus = terminal ? 'COMPLETED'
          : status === 'CANCELLED' ? 'CANCELLED'
          : number === 0 ? 'IN_PROGRESS' : 'PLANNED';
        const followUpRequired = status === 'WAITING_FOR_REQUESTER';
        const action = await tx.actionTaken.create({ data: {
          ticketId: ticket.id, performedByUserId: number === 0 ? performer.id : assignee.id,
          assigneeUserId: number === 0 ? assignee.id : performer.id,
          actionDateTime: actionTime, createdAt: actionTime,
          description: `Synthetic diagnostic work ${number + 1}`,
          result: terminal ? 'Synthetic connectivity verification completed.' : '',
          followUpRequired, followUpNote: followUpRequired ? 'Confirm the synthetic device is online.' : '',
          attachmentNotes: 'No attachment required for this synthetic fixture.', status: actionStatus,
        } });
        await tx.actionEvent.create({ data: {
          actionId: action.id, ticketId: ticket.id, actorId: action.performedByUserId,
          type: 'CREATED', version: 1, createdAt: actionTime,
          changes: { fixture: true, status: actionStatus, description: action.description,
            result: action.result, assigneeUserId: action.assigneeUserId,
            followUpRequired, followUpNote: action.followUpNote },
        } });
      }
    });
  }
}
