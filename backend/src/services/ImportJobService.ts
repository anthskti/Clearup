import { ImportJobRepository, type ImportProgress } from "../repositories/ImportJobRepository";
import type { ImportType } from "../models/ImportRun";
import { ImportReportService } from "./ImportReportService";

export class ImportJobService {
  private jobs = new ImportJobRepository();
  private reports = new ImportReportService();

  enqueue(input: { importType: ImportType; sourceName: string; actorId: string; requestId: string; submissionKey: string; csv: string }) {
    return this.jobs.enqueue(input);
  }

  async getRun(importId: number) {
    const run = await this.reports.getRun(importId);
    if (!run) return null;
    const job = await this.jobs.get(importId);
    return job ? { ...run, ...this.toStatus(job) } : run;
  }

  async listRuns(limit: number, offset: number) {
    const page = await this.reports.listRuns(limit, offset);
    const jobRows = await this.jobs.listForImports(page.rows.map((row: any) => row.id));
    const jobs = new Map(jobRows.map((job: any) => [Number(job.importId), job]));
    return { ...page, rows: page.rows.map((row: any) => {
      const job = jobs.get(Number(row.id));
      return job ? { ...row, ...this.toStatus(job) } : row;
    }) };
  }

  private toStatus(job: any) {
    const progress: ImportProgress = {
      record: Number(job.progressRecord), received: Number(job.progressReceived),
      processed: Number(job.progressProcessed), created: Number(job.progressCreated),
      updated: Number(job.progressUpdated), skipped: Number(job.progressSkipped),
      failed: Number(job.progressFailed), warnings: Number(job.progressWarnings),
      partialSuccess: Number(job.progressPartialSuccess),
    };
    return { jobStatus: job.status, progress, heartbeatAt: job.heartbeatAt, jobError: job.error };
  }
}
