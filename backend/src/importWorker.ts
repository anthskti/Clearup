import { setTimeout as delay } from "node:timers/promises";
import sequelize from "./db";
import { ImportJobRepository } from "./repositories/ImportJobRepository";
import { ImportReportService } from "./services/ImportReportService";
import { ProductImportService } from "./services/ProductImportService";
import { runWithImportAttempt } from "./lib/importAttempt";
import type { CsvRowError, CsvImportProgress } from "./types/csv";
import logger, { reportError } from "./lib/logger";

const jobs = new ImportJobRepository();
const reports = new ImportReportService();
const importer = new ProductImportService();
let stopping = false;
process.on("SIGINT", () => { stopping = true; logger.info({ event: "catalog_import.worker.shutdown_requested", signal: "SIGINT" }, "Import worker will stop after its current job"); });
process.on("SIGTERM", () => { stopping = true; logger.info({ event: "catalog_import.worker.shutdown_requested", signal: "SIGTERM" }, "Import worker will stop after its current job"); });

async function main() {
  await sequelize.authenticate();
  logger.info({ event: "catalog_import.worker.started" }, "Import worker started");
  while (!stopping) {
    let job;
    try {
      job = await jobs.claim();
    } catch (error) {
      reportError(error, { scope: "ImportWorker.claim", code: "IMPORT_WORKER_CLAIM_FAILED" });
      await delay(3000);
      continue;
    }
    if (!job) { await delay(1000); continue; }
    logger.info({ event: "catalog_import.worker.claimed", importId: job.importId, attemptId: job.attemptId, importType: job.importType }, "Import worker claimed a job");
    let ownershipLost = false;
    const heartbeat = setInterval(() => {
      void jobs.heartbeat(job.id, job.attemptId).then((owned) => { if (!owned) ownershipLost = true; })
        .catch(() => { ownershipLost = true; });
    }, 5000);
    try {
      const process = job.importType === "products"
        ? (csv: string, issue: (row: CsvRowError) => Promise<void>, progress?: (value: CsvImportProgress) => Promise<void>) => importer.importProductsCsv(csv, issue, progress)
        : job.importType === "offers"
          ? (csv: string, issue: (row: CsvRowError) => Promise<void>, progress?: (value: CsvImportProgress) => Promise<void>) => importer.importMerchantOffersCsv(csv, issue, progress)
          : (csv: string, issue: (row: CsvRowError) => Promise<void>, progress?: (value: CsvImportProgress) => Promise<void>) => importer.importPriceUpdatesCsv(csv, issue, progress);
      const result = await runWithImportAttempt({ jobId: job.id, attemptId: job.attemptId }, () => reports.runImport({
        importId: job.importId,
        importType: job.importType,
        sourceName: job.sourceName,
        actorId: job.actorId,
        requestId: job.requestId,
        csv: job.csv,
        process,
        onProgress: async (progress) => {
          if (ownershipLost || !(await jobs.checkpoint(job.id, job.attemptId, progress))) {
            throw new Error("Import attempt lost ownership; progress and further writes were stopped.");
          }
        },
      }));
      if (!(await jobs.finish(job.id, job.attemptId, result.status))) {
        throw new Error("Import attempt lost ownership before completion.");
      }
      logger.info({ event: "catalog_import.worker.finished", importId: job.importId, status: result.status }, "Import worker completed a job");
    } catch (error) {
      await jobs.markInterrupted(job.id, job.attemptId, "Import stopped before completion. Catalog changes may be partial; automatic replay is disabled.");
      reportError(error, { scope: "ImportWorker.process", code: "IMPORT_WORKER_JOB_FAILED" });
    } finally { clearInterval(heartbeat); }
  }
  await sequelize.close();
  logger.info({ event: "catalog_import.worker.stopped" }, "Import worker stopped");
}

void main().catch(async (error) => {
  reportError(error, { scope: "ImportWorker.startup", code: "IMPORT_WORKER_START_FAILED" });
  await sequelize.close();
  process.exitCode = 1;
});
