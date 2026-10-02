import { PrismaClient } from "@prisma/client";

// Reserved, stable local-lab identifiers. Never overwrite a Ticket that staff
// have already worked on, or reset any existing user's credentials.
export const ticketExamples = [
  { suffix: "DEMO0001", requester: "amina", owner: null, category: "Network", system: "Campus Wi-Fi", summary: "Library Wi-Fi disconnects during lectures", status: "NEW", priority: "HIGH" },
  { suffix: "DEMO0002", requester: "ben", owner: "iris", category: "Hardware", system: "Printer", summary: "Office printer stops after the first page", status: "OPEN", priority: "MEDIUM" },
  { suffix: "DEMO0003", requester: "chanya", owner: "jonas", category: "Software", system: "LEB2 App", summary: "Assignment upload remains pending", status: "IN_PROGRESS", priority: "HIGH" },
  { suffix: "DEMO0004", requester: "darin", owner: "kanya", category: "Account and Access", system: "VPN", summary: "VPN access needs a device compatibility check", status: "WAITING_FOR_REQUESTER", priority: "MEDIUM" },
  { suffix: "DEMO0005", requester: "amina", owner: "iris", category: "Account and Access", system: "Email", summary: "Email access restored after account verification", status: "RESOLVED", priority: "HIGH" },
  { suffix: "DEMO0006", requester: "ben", owner: "jonas", category: "Hardware", system: "Corporate Laptop", summary: "Laptop battery replacement completed", status: "CLOSED", priority: "LOW" },
  { suffix: "DEMO0007", requester: "chanya", owner: "kanya", category: "Software", system: "Grade Submission App", summary: "Grade submission error returned after retry", status: "REOPENED", priority: "HIGH" },
  { suffix: "DEMO0008", requester: "darin", owner: null, category: "Hardware", system: "Printer", summary: "Duplicate printer installation request cancelled", status: "CANCELLED", priority: "LOW" },
] as const;

const requesterEmails = { amina: "amina.rahman@example.test", ben: "ben.carter@example.test", chanya: "chanya.srisawat@example.test", darin: "darin.wong@example.test" };
const staffEmails = { iris: "iris.nattapong@example.test", jonas: "jonas.miller@example.test", kanya: "kanya.preecha@example.test" };

export async function seedTicketExamples(prisma: PrismaClient) {
  for (const example of ticketExamples) {
    await prisma.$transaction(async (tx) => {
      const requester = await tx.user.findUniqueOrThrow({ where: { email: requesterEmails[example.requester] } });
      if (!requester.developmentRequesterId) throw new Error("Seed Requester is missing its migration mapping.");
      const owner = example.owner ? await tx.user.findUniqueOrThrow({ where: { email: staffEmails[example.owner] } }) : null;
      const author = owner ?? await tx.user.findUniqueOrThrow({ where: { email: staffEmails.iris } });
      const category = await tx.category.findUniqueOrThrow({ where: { name: example.category } });
      const system = await tx.relatedSystem.findUniqueOrThrow({ where: { name: example.system } });
      const ticket = await tx.ticket.upsert({
        where: { ticketNumber: `TKT-20260901-${example.suffix}` },
        update: {},
        create: {
          ticketNumber: `TKT-20260901-${example.suffix}`, requesterId: requester.developmentRequesterId,
          requesterUserId: requester.id, ownerUserId: owner?.id ?? null, categoryId: category.id,
          relatedSystemId: system.id, summary: example.summary,
          description: `${example.summary}. Please investigate this local demonstration request; all accounts and content are synthetic.`,
          requestedPriority: example.priority, itPriority: example.priority, currentStatus: example.status,
          createdAt: new Date(`2026-09-01T0${ticketExamples.indexOf(example)}:00:00.000Z`),
        },
      });
      const content = "Local demo: the support team has received this request and will share progress here.";
      if (!await tx.publicComment.findFirst({ where: { ticketId: ticket.id, authorId: author.id, content } })) {
        await tx.publicComment.create({ data: { ticketId: ticket.id, authorId: author.id, content } });
      }
      const note = "Local demo internal note: check the synthetic device record before the next update. No personal or secret information is stored here.";
      if (!await tx.internalNote.findFirst({ where: { ticketId: ticket.id, authorId: author.id, content: note } })) {
        await tx.internalNote.create({ data: { ticketId: ticket.id, authorId: author.id, content: note } });
      }
    });
  }
}
