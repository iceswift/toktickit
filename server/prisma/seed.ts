import { getPrisma } from "../src/prisma.js";

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

  console.log(`Seeded ${categoryNames.length} IT request categories, ${relatedSystems.length} related systems, and ${developmentRequesters.length} development requesters.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
