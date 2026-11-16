import { setTimeout as delay } from "node:timers/promises";
import { ImportJobRepository } from "../repositories/ImportJobRepository";
import { ImportReportService } from "./ImportReportService";
import { ProductImportService } from "./ProductImportService";
import { runWithImportAttempt } from "../lib/importAttempt";
import type { CsvRowError, CsvImportProgress } from "../types/csv";
import logger, { reportError } from "../lib/logger";

type ClaimedJob = NonNullable<Awaited<ReturnType<ImportJobRepository["claim"]>>>;

export class ImportProcessorService {
  private jobs = new ImportJobRepository();
  private reports = new ImportReportService();
  private importer = new ProductImportService();
  private pending: number[] = [];
  private running: Promise<void> | null = null;
  private stopping = false;

  async initialize(): Promise<void> {
    // This deployment has one API process. Old uploads require a deliberate resubmission.
    await this.jobs.interruptUnfinished(
      "Server restarted before this import finished. Review partial results and upload again if needed; automatic replay is disabled.",
    );
  }

  submit(importId: number): void {
    if (this.stopping) return;
    this.pending.push(importId);
    this.startPending();
  }

  private startPending(): void {
    if (this.stopping || this.running || this.pending.length === 0) return;
    // Yield until after the upload handler sends its response. There is no idle polling.
    this.running = new Promise<void>((resolve) => setImmediate(resolve))
      .then(() => this.processPending())
      .catch((error: unknown) => {
        reportError(error, { scope: "ImportProcessor.processPending", code: "IMPORT_PROCESSOR_FAILED" });
      })
      .finally(() => {
        this.running = null;
        // A submission may arrive as the previous drain finishes.
        this.startPending();
      });
  }

  private async processPending(): Promise<void> {
    while (!this.stopping && this.pending.length > 0) {
      const importId = this.pending.shift()!;
      try {
        const job = await this.jobs.claim(importId);
        if (!job) {
          await this.saveInterruptedStatus(importId, "Import could not start. Review its status and upload again if needed.");
          continue;
        }
        await this.processJob(job);
      } catch (error: unknown) {
        reportError(error, { scope: "ImportProcessor.processPending", code: "IMPORT_JOB_FAILED" });
        await this.saveInterruptedStatus(importId, "Import stopped unexpectedly. Review partial results and upload again if needed.");
      }
    }
  }

  private async saveInterruptedStatus(importId: number, message: string): Promise<void> {
    // Retry only the status/report transaction; replaying CSV writes could overwrite newer edits.
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.jobs.interruptUnfinished(message, importId);
        return;
      } catch (error: unknown) {
        if (attempt === maxAttempts) {
          reportError(error, {
            scope: "ImportProcessor.saveInterruptedStatus",
            code: "IMPORT_INTERRUPTED_STATUS_SAVE_FAILED",
          }, logger.child({ importId, attempts: maxAttempts }));
          // Let other accepted jobs continue; startup cleanup will revisit unfinished jobs.
          return;
        }
        await delay(2000);
      }
    }
  }

  private async processJob(job: ClaimedJob): Promise<void> {
    logger.info({ event: "catalog_import.claimed", importId: job.importId, attemptId: job.attemptId }, "API claimed an import");
    let ownershipLost = false;
    const heartbeat = setInterval(() => {
      void this.jobs.heartbeat(job.id, job.attemptId)
        .then((owned) => { if (!owned) ownershipLost = true; })
        .catch(() => { ownershipLost = true; });
    }, 5000);

    try {
      const process = (csv: string, issue: (row: CsvRowError) => Promise<void>, progress?: (value: CsvImportProgress) => Promise<void>) => {
        switch (job.importType) {
          case "products": return this.importer.importProductsCsv(csv, issue, progress);
          case "offers": return this.importer.importMerchantOffersCsv(csv, issue, progress);
          case "prices": return this.importer.importPriceUpdatesCsv(csv, issue, progress);
          default: throw new Error("Unknown import type.");
        }
      };
      const result = await runWithImportAttempt({ jobId: job.id, attemptId: job.attemptId }, () => this.reports.runImport({
        importId: job.importId,
        importType: job.importType,
        sourceName: job.sourceName,
        actorId: job.actorId,
        requestId: job.requestId,
        csv: job.csv,
        process,
        onProgress: async (progress) => {
          if (ownershipLost || !(await this.jobs.checkpoint(job.id, job.attemptId, progress))) {
            throw new Error("Import attempt lost ownership; further writes were stopped.");
          }
        },
      }));
      if (!(await this.jobs.finish(job.id, job.attemptId, result.status))) {
        throw new Error("Import attempt lost ownership before completion.");
      }
    } finally {
      clearInterval(heartbeat);
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    await this.running;
    this.pending = [];
  }

  async markStoppedImports(): Promise<void> {
    await this.jobs.interruptUnfinished("Server shut down before this import started. Upload again if needed.");
  }
}

export const importProcessor = new ImportProcessorService();
