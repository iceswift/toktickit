-- Lab 3 transition migration. The legacy DevelopmentRequester relation remains
-- temporarily so Lab 2 endpoints can continue operating until authenticated
-- requester identity replaces the selector in Phase 4.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'IT_STAFF', 'ADMINISTRATOR');

ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'WAITING_FOR_REQUESTER';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'REOPENED';
ALTER TYPE "TicketStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "developmentRequesterId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_developmentRequesterId_key" ON "User"("developmentRequesterId");
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

ALTER TABLE "Ticket" ADD COLUMN "requesterUserId" INTEGER;
ALTER TABLE "Ticket" ADD COLUMN "ownerUserId" INTEGER;
ALTER TABLE "Attachment" ADD COLUMN "removedByUserId" INTEGER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "DevelopmentRequester"
    GROUP BY lower(trim("email")) HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot migrate DevelopmentRequester records: normalized emails are not unique';
  END IF;
END $$;

-- This is an intentionally local-only, documented initial password. pgcrypto
-- writes a bcrypt hash; no plaintext password is stored in the database.
INSERT INTO "User" (
  "name", "email", "passwordHash", "role", "isActive", "mustChangePassword",
  "developmentRequesterId", "createdAt", "updatedAt"
)
SELECT
  d."displayName", lower(trim(d."email")),
  crypt('Lab3Initial!2026', gen_salt('bf', 12)),
  'REQUESTER'::"UserRole", d."isActive", true,
  d."id", d."createdAt", d."updatedAt"
FROM "DevelopmentRequester" d;

UPDATE "Ticket" t
SET "requesterUserId" = u."id",
    "itPriority" = t."requestedPriority"::text::"ITPriority"
FROM "User" u
WHERE u."developmentRequesterId" = t."requesterId";

UPDATE "Attachment" a
SET "removedByUserId" = u."id"
FROM "User" u
WHERE u."developmentRequesterId" = a."removedByRequesterId";

ALTER TABLE "User" ADD CONSTRAINT "User_developmentRequesterId_fkey"
  FOREIGN KEY ("developmentRequesterId") REFERENCES "DevelopmentRequester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_requesterUserId_fkey"
  FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_removedByUserId_fkey"
  FOREIGN KEY ("removedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Ticket_requesterUserId_createdAt_idx" ON "Ticket"("requesterUserId", "createdAt");
CREATE INDEX "Ticket_ownerUserId_currentStatus_idx" ON "Ticket"("ownerUserId", "currentStatus");
