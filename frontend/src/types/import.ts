import type { CsvImportResponse } from "@/types/product";

export type ImportJobStatus = "queued" | "processing" | "needs_review" | "completed" | "partial" | "failed";
export type ImportAccepted = { importId: number; status: ImportJobStatus; message: string };

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

export type ImportRun = {
  jobStatus?: ImportJobStatus;
  progress?: ImportProgress;
  heartbeatAt?: string | null;
  jobError?: string | null;
  id: number;
  importType: "products" | "offers" | "prices";
  sourceName: string;
  actorId: string | null;
  requestId: string | null;
  status: "processing" | "completed" | "partial" | "failed";
  reportComplete: boolean;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  received: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  warnings: number;
  partialSuccess: number;
};

export type ImportIssue = {
  id: number;
  importId: number;
  recordNumber: number;
  sourceLineStart: number;
  sourceLineEnd: number;
  brand: string | null;
  name: string | null;
  code: string;
  outcome: "skipped" | "warning" | "failed" | "partial_success";
  stage: string;
  reason: string;
};

export type ImportPage<T> = { rows: T[]; total: number };
export type ImportReport = { run: ImportRun; issues: ImportIssue[] };
export type ImportResult = CsvImportResponse;
