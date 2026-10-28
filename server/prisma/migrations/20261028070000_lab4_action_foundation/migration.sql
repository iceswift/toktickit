BEGIN;
-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionEventType" AS ENUM ('CREATED', 'UPDATED', 'ASSIGNED', 'STATUS_CHANGED');

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "lastResolvedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ActionTaken" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "performedByUserId" INTEGER NOT NULL,
    "assigneeUserId" INTEGER NOT NULL,
    "actionDateTime" TIMESTAMP(3) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "result" VARCHAR(2000) NOT NULL DEFAULT '',
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNote" VARCHAR(2000) NOT NULL DEFAULT '',
    "attachmentNotes" VARCHAR(2000) NOT NULL DEFAULT '',
    "status" "ActionStatus" NOT NULL DEFAULT 'PLANNED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTaken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionEvent" (
    "id" SERIAL NOT NULL,
    "actionId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "type" "ActionEventType" NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketWorkflowEvent" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "fromStatus" "TicketStatus" NOT NULL,
    "toStatus" "TicketStatus" NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketWorkflowEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "operation" VARCHAR(32) NOT NULL DEFAULT 'CREATE_ACTION',
    "key" VARCHAR(128) NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "actionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionTaken_ticketId_actionDateTime_id_idx" ON "ActionTaken"("ticketId", "actionDateTime", "id");

-- CreateIndex
CREATE INDEX "ActionTaken_performedByUserId_createdAt_idx" ON "ActionTaken"("performedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionTaken_assigneeUserId_status_idx" ON "ActionTaken"("assigneeUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActionTaken_id_ticketId_key" ON "ActionTaken"("id", "ticketId");

-- CreateIndex
CREATE INDEX "ActionEvent_ticketId_createdAt_id_idx" ON "ActionEvent"("ticketId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ActionEvent_actionId_version_key" ON "ActionEvent"("actionId", "version");

-- CreateIndex
CREATE INDEX "TicketWorkflowEvent_ticketId_createdAt_id_idx" ON "TicketWorkflowEvent"("ticketId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "TicketWorkflowEvent_ticketId_version_key" ON "TicketWorkflowEvent"("ticketId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_userId_ticketId_operation_key_key" ON "IdempotencyRecord"("userId", "ticketId", "operation", "key");

-- CreateIndex
CREATE INDEX "Ticket_requesterUserId_currentStatus_lastResolvedAt_idx" ON "Ticket"("requesterUserId", "currentStatus", "lastResolvedAt");

-- CreateIndex
CREATE INDEX "Ticket_currentStatus_itPriority_updatedAt_idx" ON "Ticket"("currentStatus", "itPriority", "updatedAt");

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTaken" ADD CONSTRAINT "ActionTaken_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_actionId_ticketId_fkey" FOREIGN KEY ("actionId", "ticketId") REFERENCES "ActionTaken"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionEvent" ADD CONSTRAINT "ActionEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketWorkflowEvent" ADD CONSTRAINT "TicketWorkflowEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketWorkflowEvent" ADD CONSTRAINT "TicketWorkflowEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyRecord" ADD CONSTRAINT "IdempotencyRecord_actionId_ticketId_fkey" FOREIGN KEY ("actionId", "ticketId") REFERENCES "ActionTaken"("id", "ticketId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing Ticket values are not backfilled into fabricated work/history.
-- lastResolvedAt deliberately remains NULL for every legacy row.
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_version_positive" CHECK ("version" >= 1);
ALTER TABLE "ActionTaken"
  ADD CONSTRAINT "Action_version_positive" CHECK ("version" >= 1),
  ADD CONSTRAINT "Action_description_nonempty" CHECK (length(btrim("description")) > 0),
  ADD CONSTRAINT "Action_followup_note" CHECK (NOT "followUpRequired" OR length(btrim("followUpNote")) > 0),
  ADD CONSTRAINT "Action_completed_result" CHECK ("status" <> 'COMPLETED' OR length(btrim("result")) > 0);
ALTER TABLE "ActionEvent"
  ADD CONSTRAINT "ActionEvent_version_positive" CHECK ("version" >= 1),
  ADD CONSTRAINT "ActionEvent_changes_object" CHECK (jsonb_typeof("changes") = 'object');
ALTER TABLE "TicketWorkflowEvent"
  ADD CONSTRAINT "Workflow_version_positive" CHECK ("version" >= 1),
  ADD CONSTRAINT "Workflow_actual_transition" CHECK ("fromStatus" <> "toStatus");
ALTER TABLE "IdempotencyRecord"
  ADD CONSTRAINT "Idempotency_key_format" CHECK ("key" ~ '^[A-Za-z0-9_-]{8,128}$'),
  ADD CONSTRAINT "Idempotency_hash_format" CHECK ("payloadHash" ~ '^[a-f0-9]{64}$');

-- Additional defense behind the future API: ordinary UPDATE/DELETE cannot
-- rewrite audit rows or discard work. A database administrator can still
-- perform backup/recovery; this is not a defense against a hostile superuser.
CREATE FUNCTION lab4_reject_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Lab4 append-only record: % is not permitted', TG_OP USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER "ActionEvent_append_only" BEFORE UPDATE OR DELETE ON "ActionEvent"
  FOR EACH ROW EXECUTE FUNCTION lab4_reject_history_mutation();
CREATE TRIGGER "TicketWorkflowEvent_append_only" BEFORE UPDATE OR DELETE ON "TicketWorkflowEvent"
  FOR EACH ROW EXECUTE FUNCTION lab4_reject_history_mutation();
CREATE TRIGGER "IdempotencyRecord_immutable" BEFORE UPDATE OR DELETE ON "IdempotencyRecord"
  FOR EACH ROW EXECUTE FUNCTION lab4_reject_history_mutation();
CREATE TRIGGER "ActionTaken_no_delete" BEFORE DELETE ON "ActionTaken"
  FOR EACH ROW EXECUTE FUNCTION lab4_reject_history_mutation();
CREATE FUNCTION lab4_protect_action_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW."id", NEW."ticketId", NEW."performedByUserId", NEW."createdAt")
     IS DISTINCT FROM ROW(OLD."id", OLD."ticketId", OLD."performedByUserId", OLD."createdAt") THEN
    RAISE EXCEPTION 'Action identity and creator are immutable' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "ActionTaken_immutable_identity" BEFORE UPDATE ON "ActionTaken"
  FOR EACH ROW EXECUTE FUNCTION lab4_protect_action_identity();

COMMIT;
