import { AsyncLocalStorage } from "node:async_hooks";
import { QueryTypes, type Transaction } from "sequelize";
import sequelize from "../db";

type Attempt = { jobId: number; attemptId: string };
const current = new AsyncLocalStorage<Attempt>();

export function runWithImportAttempt<T>(attempt: Attempt, work: () => Promise<T>): Promise<T> {
  return current.run(attempt, work);
}

/** Every import mutation locks and renews the owning job before writing. */
export async function withFencedImportWrite<T>(
  write: (transaction?: Transaction) => Promise<T>,
): Promise<T> {
  const attempt = current.getStore();
  if (!attempt) return write();
  return sequelize.transaction(async (transaction) => {
    const rows = await sequelize.query<{ id: number }>(
      `SELECT id FROM import_jobs WHERE id=:jobId AND status='processing' AND "attemptId"=:attemptId FOR UPDATE`,
      { replacements: { jobId: attempt.jobId, attemptId: attempt.attemptId }, transaction, type: QueryTypes.SELECT },
    );
    if (!rows.length) throw new Error("Import attempt lost ownership; writes were stopped.");
    await sequelize.query(
      `UPDATE import_jobs SET "heartbeatAt"=NOW(),"updatedAt"=NOW() WHERE id=:jobId AND "attemptId"=:attemptId`,
      { replacements: { jobId: attempt.jobId, attemptId: attempt.attemptId }, transaction },
    );
    return write(transaction);
  });
}
