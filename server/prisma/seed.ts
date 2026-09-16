import { getPrisma } from "../src/prisma.js";
import { hash } from "bcryptjs";

const categoryNames = [
  "Account and Access",
  "Hardware",
  "Software",
  "Network",
] as const;

const developmentRequesters = [
  { displayName: "Amina Rahman", email: "amina.rahman@example.test", isActive: true },
  { displayName: "Ben Carter", email: "ben.carter@example.test", isActive: true },
  { displayName: "Chanya Srisawat", email: "chanya.srisawat@example.test", isActive: true },
  { displayName: "Darin Wong", email: "darin.wong@example.test", isActive: true },
  { displayName: "Former Requester", email: "former.requester@example.test", isActive: false },
] as const;

const relatedSystems = [
  "Campus Wi-Fi",
  "Corporate Laptop",
  "Email",
  "Grade Submission App",
  "LEB2 App",
  "Printer",
  "VPN",
] as const;

const LOCAL_INITIAL_PASSWORD = "Lab3Initial!2026";

const staffUsers = [
  { name: "Iris Nattapong", email: "iris.nattapong@example.test", role: "IT_STAFF", isActive: true },
  { name: "Jonas Miller", email: "jonas.miller@example.test", role: "IT_STAFF", isActive: true },
  { name: "Kanya Preecha", email: "kanya.preecha@example.test", role: "IT_STAFF", isActive: true },
  { name: "Retired IT Staff", email: "retired.staff@example.test", role: "IT_STAFF", isActive: false },
] as const;

const administrators = [
  { name: "Narin Administrator", email: "narin.admin@example.test", role: "ADMINISTRATOR", isActive: true },
] as const;

// Issue 3 — seed the four supported categories.
// The four names are: Account and Access, Hardware, Software, Network.
// Requirement: running the seed twice must NOT create duplicates.
// Hint: prisma.category.upsert({ where:{name}, update:{}, create:{name} }).
async function main() {
  const prisma = getPrisma();

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  for (const requester of developmentRequesters) {
    await prisma.developmentRequester.upsert({
      where: { email: requester.email },
      update: { displayName: requester.displayName, isActive: requester.isActive },
      create: requester,
    });
  }

  // Preserve a stable legacy-to-User mapping. Existing User password hashes and
  // must-change state are never reset by a repeated seed run.
  for (const requester of developmentRequesters) {
    const legacyRequester = await prisma.developmentRequester.findUniqueOrThrow({
      where: { email: requester.email },
      select: { id: true },
    });
    const email = requester.email.trim().toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: {
        name: requester.displayName,
        role: "REQUESTER",
        isActive: requester.isActive,
        developmentRequesterId: legacyRequester.id,
      },
      create: {
        name: requester.displayName,
        email,
        passwordHash: await hash(LOCAL_INITIAL_PASSWORD, 12),
        role: "REQUESTER",
        isActive: requester.isActive,
        mustChangePassword: true,
        developmentRequesterId: legacyRequester.id,
      },
    });
  }

  for (const user of [...staffUsers, ...administrators]) {
    const email = user.email.trim().toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: { name: user.name, role: user.role, isActive: user.isActive },
      create: {
        name: user.name,
        email,
        passwordHash: await hash(LOCAL_INITIAL_PASSWORD, 12),
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: true,
      },
    });
  }

  console.log(`Seeded ${categoryNames.length} IT request categories, ${relatedSystems.length} related systems, ${developmentRequesters.length} Requesters, ${staffUsers.length} IT Staff, and ${administrators.length} Administrator.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
