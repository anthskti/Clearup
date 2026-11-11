import type { MigrationFn } from "umzug";
import { upgradeImportJobsSchema } from "./014-queued-import-jobs";

type Ctx = { queryInterface: any };

/**
 * Migration 014 may already be recorded as applied from its initial schema.
 * This repeats only additive/idempotent column, hash, and index repairs.
 */
export const up: MigrationFn<Ctx> = async ({ context }) => {
  await upgradeImportJobsSchema(context.queryInterface);
};

// Keep import jobs, source CSV, and reports on rollback.
export const down: MigrationFn<Ctx> = async () => {};
