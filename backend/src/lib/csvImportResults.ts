import type {
  CsvImportResult,
  CsvRowError,
  ParsedCsvDocument,
  ParsedCsvRecord,
} from "../types/csv";

export type CsvImportType = "products" | "offers" | "prices";
export type ImportIssueWriter = (issue: CsvRowError) => Promise<void>;

export function invalidCsvHeaders(
  headers: string[],
  received: number,
  required: string[],
  importType: CsvImportType,
  startedAt: number,
): CsvImportResult | null {
  const missing = required.filter((column) => !headers.includes(column));
  if (!missing.length) return null;
  const message = `Missing required CSV columns: ${missing.join(", ")}.`;
  return {
    ok: false,
    importType,
    message,
    totals: {
      received,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: received,
      failed: 0,
    },
    errors: [{
      row: 1,
      recordNumber: 0,
      sourceLineStart: 1,
      sourceLineEnd: 1,
      code: "INVALID_HEADERS",
      message,
      outcome: "failed",
      stage: "headers",
    }],
    durationMs: Date.now() - startedAt,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: received,
  };
}

export async function persistNewIssues(
  errors: CsvRowError[],
  start: number,
  record: ParsedCsvRecord,
  row: Record<string, string>,
  importType: CsvImportType,
  writer?: ImportIssueWriter,
): Promise<{ warnings: number; partialSuccess: number }> {
  let warnings = 0;
  let partialSuccess = 0;
  for (let index = start; index < errors.length; index += 1) {
    const issue = errors[index];
    const isPartialSuccess =
      issue.code === "MERCHANT_NOT_FOUND" || issue.outcome === "partial_success";
    const outcome = issue.outcome ?? (issue.code === "ROW_PROCESS_FAILED"
      ? "failed"
      : isPartialSuccess
        ? "partial_success"
        : "skipped");
    if (isPartialSuccess) {
      warnings += 1;
      partialSuccess += 1;
    }
    const enriched: CsvRowError = {
      ...issue,
      row: record.sourceLineStart,
      recordNumber: record.recordNumber,
      sourceLineStart: record.sourceLineStart,
      sourceLineEnd: record.sourceLineEnd,
      brand: row.brand ?? "",
      name: row.name ?? "",
      outcome,
      stage: issue.stage ?? (isPartialSuccess
        ? "merchant_offer"
        : importType === "products"
          ? "catalog"
          : importType === "offers"
            ? "merchant_offer"
            : "price_update"),
    };
    errors[index] = enriched;
    await writer?.(enriched);
  }
  return { warnings, partialSuccess };
}

export function safeRowFailure(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "The row could not be saved because of a database or validation error.";
  }
  const value = error as {
    code?: unknown;
    name?: unknown;
    parent?: { code?: unknown };
    original?: { code?: unknown };
  };
  const code = value.code ?? value.parent?.code ?? value.original?.code;
  if (code === "23505") return "A record with the same unique key already exists.";
  if (code === "23503") return "A related catalog record could not be found.";
  if (code === "22001") return "A field exceeds the database length limit.";
  if (code === "23502") return "A required database field was missing.";
  if (value.name === "SequelizeUniqueConstraintError") {
    return "A record with the same unique key already exists.";
  }
  if (value.name === "SequelizeValidationError") {
    return "A database field failed validation.";
  }
  return "The row could not be saved because of a database or validation error.";
}

export async function persistHeaderIssue(
  result: CsvImportResult,
  document: ParsedCsvDocument,
  writer?: ImportIssueWriter,
): Promise<CsvImportResult> {
  const issue = result.errors[0];
  if (!issue) return result;
  const enriched: CsvRowError = {
    ...issue,
    row: document.headerLineStart,
    recordNumber: 0,
    sourceLineStart: document.headerLineStart,
    sourceLineEnd: document.headerLineEnd,
    outcome: "failed",
    stage: "headers",
  };
  result.errors = [enriched];
  await writer?.(enriched);
  return result;
}

export async function emptyCsvResult(
  importType: CsvImportType,
  document: ParsedCsvDocument,
  startedAt: number,
  writer?: ImportIssueWriter,
): Promise<CsvImportResult> {
  const issue: CsvRowError = {
    row: document.headerLineEnd,
    recordNumber: 0,
    sourceLineStart: document.headerLineStart,
    sourceLineEnd: document.headerLineEnd,
    code: "NO_DATA_RECORDS",
    outcome: "failed",
    stage: "records",
    message: "CSV has a header but no data records.",
  };
  await writer?.(issue);
  return {
    ok: false,
    importType,
    message: issue.message,
    totals: {
      received: 0,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 1,
      warnings: 0,
      partialSuccess: 0,
    },
    errors: [issue],
    durationMs: Date.now() - startedAt,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
  };
}
