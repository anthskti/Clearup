import { ImportReportRepository } from "../repositories/ImportReportRepository";
import type { ImportIssueAttributes } from "../models/ImportIssue";
import type { ImportRunAttributes, ImportType } from "../models/ImportRun";
import { CsvParseError } from "../lib/csvProductImport";
import logger, { reportError } from "../lib/logger";
import type { CsvImportProgress, CsvImportResult, CsvRowError } from "../types/csv";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export class ImportReportFailure extends Error {
  constructor(readonly importId: number, message = "Import stopped because its report could not be completed.") {
    super(message);
    this.name = "ImportReportFailure";
  }
}

export class ImportReportService {
  private repository = new ImportReportRepository();

  async runImport(input: {
    importType: ImportType;
    sourceName: string;
    actorId: string;
    requestId: string | null;
    csv: string;
    process: (csv: string, onIssue: (issue: CsvRowError) => Promise<void>, onProgress?: (progress: CsvImportProgress) => Promise<void>) => Promise<CsvImportResult>;
    onProgress?: (progress: CsvImportProgress) => Promise<void>;
    importId?: number;
  }): Promise<{ result: CsvImportResult; importId: number; status: string }> {
    const startedAt = Date.now();
    const run = input.importId ? { id: input.importId } : await this.startRun({
      importType: input.importType,
      sourceName: input.sourceName,
      actorId: input.actorId,
      requestId: input.requestId,
    });
    const importId = run.id;
    logger.info({ event: "catalog_import.started", importId, requestId: input.requestId, importType: input.importType, sourceName: input.sourceName }, "Catalog import started");
    const persistIssue = async (issue: CsvRowError) => {
      logger.warn({
        event: "catalog_import.row_issue",
        importId,
        requestId: input.requestId,
        importType: input.importType,
        recordNumber: issue.recordNumber,
        sourceLineStart: issue.sourceLineStart,
        sourceLineEnd: issue.sourceLineEnd,
        brand: safeLogValue(issue.brand),
        name: safeLogValue(issue.name),
        code: issue.code,
        outcome: issue.outcome,
        stage: issue.stage,
        reason: issue.message,
      }, "Catalog import row issue");
      await this.addIssue(importId, {
        recordNumber: issue.recordNumber ?? 0,
        sourceLineStart: issue.sourceLineStart ?? issue.row,
        sourceLineEnd: issue.sourceLineEnd ?? issue.row,
        brand: issue.brand,
        name: issue.name,
        code: issue.code,
        outcome: issue.outcome ?? "skipped",
        stage: issue.stage ?? input.importType,
        reason: issue.message,
      });
    };

    try {
      const result = await input.process(input.csv, persistIssue, input.onProgress);
      const totals = result.totals;
      const status = result.ok ? "completed" : totals.processed > 0 || totals.created > 0 || totals.updated > 0 ? "partial" : "failed";
      await this.finishRun(importId, {
        status,
        reportComplete: true,
        durationMs: Date.now() - startedAt,
        received: totals.received,
        processed: totals.processed,
        created: totals.created,
        updated: totals.updated,
        skipped: totals.skipped,
        failed: totals.failed,
        warnings: totals.warnings ?? 0,
        partialSuccess: totals.partialSuccess ?? 0,
      });
      logger.info({ event: "catalog_import.finished", importId, requestId: input.requestId, importType: input.importType, status, totals }, "Catalog import finished");
      return { result, importId, status };
    } catch (error: unknown) {
      if (error instanceof CsvParseError) {
        try {
          const issue: CsvRowError = {
            row: error.sourceLineStart,
            recordNumber: error.recordNumber,
            sourceLineStart: error.sourceLineStart,
            sourceLineEnd: error.sourceLineEnd,
            code: "MALFORMED_CSV",
            outcome: "failed",
            stage: "parse",
            message: error.message,
          };
          await persistIssue(issue);
          const result = malformedCsvResult(input.importType, issue, Date.now() - startedAt);
          await this.finishRun(importId, { status: "failed", reportComplete: true, durationMs: result.durationMs, failed: 1 });
          logger.info({ event: "catalog_import.finished", importId, requestId: input.requestId, importType: input.importType, status: "failed", totals: result.totals }, "Catalog import finished with invalid CSV");
          return { result, importId, status: "failed" };
        } catch (reportingError: unknown) {
          await this.markFailed(importId, startedAt, reportingError, input.requestId);
          throw new ImportReportFailure(importId);
        }
      }
      await this.markFailed(importId, startedAt, error, input.requestId);
      throw new ImportReportFailure(importId);
    }
  }

  private async markFailed(id: number, startedAt: number, error: unknown, requestId: string | null): Promise<void> {
    reportError(error, { scope: "ImportReportService.runImport", requestId: requestId ?? undefined, code: "IMPORT_FAILED" });
    logger.error({ event: "catalog_import.failed", importId: id, requestId, error }, "Catalog import stopped before its report completed");
    try {
      await this.finishRun(id, { status: "failed", reportComplete: false, durationMs: Date.now() - startedAt });
    } catch (finishError: unknown) {
      reportError(finishError, { scope: "ImportReportService.markFailed", requestId: requestId ?? undefined, code: "IMPORT_REPORT_WRITE_FAILED" });
    }
  }

  startRun(input: {
    importType: ImportType;
    sourceName: string;
    actorId: string;
    requestId: string | null;
  }) {
    return this.repository.createRun(input);
  }

  addIssue(importId: number, issue: {
    recordNumber: number;
    sourceLineStart: number;
    sourceLineEnd: number;
    brand?: string;
    name?: string;
    code: string;
    outcome: ImportIssueAttributes["outcome"];
    stage: string;
    reason: string;
  }) {
    return this.repository.addIssue({
      importId,
      recordNumber: issue.recordNumber,
      sourceLineStart: issue.sourceLineStart,
      sourceLineEnd: issue.sourceLineEnd,
      brand: issue.brand || null,
      name: issue.name || null,
      code: issue.code,
      outcome: issue.outcome,
      stage: issue.stage,
      reason: issue.reason,
    });
  }

  finishRun(id: number, values: Partial<Pick<ImportRunAttributes,
    "status" | "durationMs" | "received" | "processed" | "created" | "updated" |
    "skipped" | "failed" | "warnings" | "partialSuccess" | "reportComplete"
  >>) {
    return this.repository.finishRun(id, { ...values, finishedAt: new Date() });
  }

  listRuns(limitInput?: number, offsetInput?: number) {
    const limit = Math.min(Math.max(limitInput ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);
    const offset = Math.max(offsetInput ?? 0, 0);
    return this.repository.findRuns(limit, offset);
  }

  getRun(id: number) {
    return this.repository.findRun(id);
  }

  listIssues(importId: number, limitInput?: number, offsetInput?: number) {
    const limit = Math.min(Math.max(limitInput ?? 50, 1), MAX_PAGE_SIZE);
    const offset = Math.max(offsetInput ?? 0, 0);
    return this.repository.findIssues(importId, limit, offset);
  }

  getFullReport(importId: number) {
    return this.repository.findAllIssues(importId);
  }
}

function safeLogValue(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function malformedCsvResult(importType: ImportType, issue: CsvRowError, durationMs: number): CsvImportResult {
  return {
    ok: false,
    importType,
    message: "CSV could not be parsed.",
    totals: { received: 0, processed: 0, created: 0, updated: 0, skipped: 0, failed: 1, warnings: 0, partialSuccess: 0 },
    errors: [issue],
    durationMs,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };
}
