import { createHash, randomUUID } from "node:crypto";
import { QueryTypes } from "sequelize";
import sequelize from "../db";

const STALE_AFTER_SECONDS = 45;

export type ImportProgress = {
  record: number;
  received: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  warnings: number;
  partialSuccess: number;
};

export class ImportSubmissionConflict extends Error {
  constructor() {
    super("This submission key was already used for different CSV content or import type.");
    this.name = "ImportSubmissionConflict";
  }
}

export class ImportJobRepository {
  async enqueue(input: {
    importType: string;
    sourceName: string;
    actorId: string;
    requestId: string;
    submissionKey: string;
    csv: string;
  }) {
    const csvHash = createHash("sha256").update(input.csv, "utf8").digest("hex");
    return sequelize.transaction(async (transaction) => {
      // Serialize identical actor/key submissions before looking up the prior row.
      await sequelize.query(
        "SELECT pg_advisory_xact_lock(hashtext(:actor), hashtext(:key))",
        { replacements: { actor: input.actorId, key: input.submissionKey }, transaction },
      );
      const prior = await sequelize.query<any>(
        `SELECT "importId", status, "importType", "csvHash" FROM import_jobs
         WHERE "actorId"=:actor AND "submissionKey"=:key`,
        { replacements: { actor: input.actorId, key: input.submissionKey }, type: QueryTypes.SELECT, transaction },
      );
      if (prior[0]) {
        if (prior[0].importType !== input.importType || prior[0].csvHash !== csvHash) {
          throw new ImportSubmissionConflict();
        }
        return { importId: Number(prior[0].importId), status: String(prior[0].status), duplicate: true };
      }

      const [insertedRuns] = await sequelize.query(
        `INSERT INTO import_runs ("importType", "sourceName", "actorId", "requestId", status, "startedAt", "createdAt", "updatedAt")
         VALUES (:type,:name,:actor,:request,'processing',NOW(),NOW(),NOW()) RETURNING id`,
        { replacements: { type: input.importType, name: input.sourceName, actor: input.actorId, request: input.requestId }, transaction },
      );
      const importId = Number((insertedRuns as any[])[0].id);
      await sequelize.query(
        `INSERT INTO import_jobs ("importId","importType","sourceName","actorId","submissionKey","csvHash",csv,status,"createdAt","updatedAt")
         VALUES (:id,:type,:name,:actor,:key,:hash,:csv,'queued',NOW(),NOW())`,
        { replacements: { id: importId, type: input.importType, name: input.sourceName, actor: input.actorId, key: input.submissionKey, hash: csvHash, csv: input.csv }, transaction },
      );
      return { importId, status: "queued", duplicate: false };
    });
  }

  async claim() {
    const attemptId = randomUUID();
    return sequelize.transaction(async (transaction) => {
      // This lock enforces one active import across all worker processes.
      await sequelize.query("SELECT pg_advisory_xact_lock(74218032)", { transaction });
      await sequelize.query(
        `UPDATE import_jobs SET status='needs_review', error='Worker heartbeat expired; automatic replay is disabled.', "updatedAt"=NOW()
         WHERE status='processing' AND "heartbeatAt" < NOW() - (:seconds * INTERVAL '1 second')`,
        { replacements: { seconds: STALE_AFTER_SECONDS }, transaction },
      );
      const active = await sequelize.query<{ id: number }>(
        "SELECT id FROM import_jobs WHERE status='processing' LIMIT 1",
        { type: QueryTypes.SELECT, transaction },
      );
      if (active.length) return null;

      const rows = await sequelize.query<any>(
        `WITH picked AS (
           SELECT id FROM import_jobs WHERE status='queued' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1
         )
         UPDATE import_jobs j SET status='processing', "attemptId"=:attempt, "heartbeatAt"=NOW(), "updatedAt"=NOW()
         FROM picked WHERE j.id=picked.id RETURNING j.*`,
        { replacements: { attempt: attemptId }, type: QueryTypes.SELECT, transaction },
      );
      return rows[0] ? { ...rows[0], attemptId } : null;
    });
  }

  async heartbeat(id: number, attemptId: string): Promise<boolean> {
    const rows = await sequelize.query<{ id: number }>(
      `UPDATE import_jobs SET "heartbeatAt"=NOW(),"updatedAt"=NOW()
       WHERE id=:id AND status='processing' AND "attemptId"=:attempt RETURNING id`,
      { replacements: { id, attempt: attemptId }, type: QueryTypes.SELECT },
    );
    return rows.length === 1;
  }

  async checkpoint(id: number, attemptId: string, progress: ImportProgress): Promise<boolean> {
    const rows = await sequelize.query<{ id: number }>(
      `UPDATE import_jobs SET "heartbeatAt"=NOW(), "updatedAt"=NOW(),
         "progressRecord"=:record, "progressReceived"=:received, "progressProcessed"=:processed,
         "progressCreated"=:created, "progressUpdated"=:updated, "progressSkipped"=:skipped,
         "progressFailed"=:failed, "progressWarnings"=:warnings, "progressPartialSuccess"=:partial
       WHERE id=:id AND status='processing' AND "attemptId"=:attempt AND "progressRecord" < :record RETURNING id`,
      { replacements: { id, attempt: attemptId, record: progress.record, received: progress.received, processed: progress.processed, created: progress.created, updated: progress.updated, skipped: progress.skipped, failed: progress.failed, warnings: progress.warnings, partial: progress.partialSuccess }, type: QueryTypes.SELECT },
    );
    return rows.length === 1;
  }

  async finish(id: number, attemptId: string, status: string, error: string | null = null): Promise<boolean> {
    const rows = await sequelize.query<{ id: number }>(
      `UPDATE import_jobs SET status=:status,error=:error,"updatedAt"=NOW()
       WHERE id=:id AND status='processing' AND "attemptId"=:attempt RETURNING id`,
      { replacements: { id, attempt: attemptId, status, error }, type: QueryTypes.SELECT },
    );
    return rows.length === 1;
  }

  async markInterrupted(id: number, attemptId: string, message: string): Promise<boolean> {
    return this.finish(id, attemptId, "needs_review", message.slice(0, 2000));
  }

  async list() {
    await this.markStaleAttempts();
    return sequelize.query<any>(
      `SELECT "importId",status,"heartbeatAt",error,"progressRecord","progressReceived","progressProcessed",
       "progressCreated","progressUpdated","progressSkipped","progressFailed","progressWarnings","progressPartialSuccess"
       FROM import_jobs ORDER BY id DESC LIMIT 100`,
      { type: QueryTypes.SELECT },
    );
  }

  async listForImports(importIds: number[]) {
    if (importIds.length === 0) return [];
    await this.markStaleAttempts();
    return sequelize.query<any>(
      `SELECT "importId",status,"heartbeatAt",error,"progressRecord","progressReceived","progressProcessed",
       "progressCreated","progressUpdated","progressSkipped","progressFailed","progressWarnings","progressPartialSuccess"
       FROM import_jobs WHERE "importId" IN (:importIds)`,
      { replacements: { importIds }, type: QueryTypes.SELECT },
    );
  }

  async get(importId: number) {
    await this.markStaleAttempts();
    const rows = await sequelize.query<any>(
      `SELECT "importId",status,"heartbeatAt",error,"progressRecord","progressReceived","progressProcessed",
       "progressCreated","progressUpdated","progressSkipped","progressFailed","progressWarnings","progressPartialSuccess"
       FROM import_jobs WHERE "importId"=:importId`,
      { replacements: { importId }, type: QueryTypes.SELECT },
    );
    return rows[0] ?? null;
  }

  private async markStaleAttempts() {
    await sequelize.query(
      `UPDATE import_jobs SET status='needs_review', error='Worker heartbeat expired; automatic replay is disabled.', "updatedAt"=NOW()
       WHERE status='processing' AND "heartbeatAt" < NOW() - (:seconds * INTERVAL '1 second')`,
      { replacements: { seconds: STALE_AFTER_SECONDS } },
    );
  }

  async getQueuedPayload(id: number, attemptId: string) {
    const rows = await sequelize.query<any>(
      `SELECT j.* FROM import_jobs j WHERE j.id=:id AND j.status='processing' AND j."attemptId"=:attempt`,
      { replacements: { id, attempt: attemptId }, type: QueryTypes.SELECT },
    );
    return rows[0] ?? null;
  }
}
