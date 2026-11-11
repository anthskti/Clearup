export type CsvRowError = {
  recordNumber?: number;
  row: number;
  sourceLineStart?: number;
  sourceLineEnd?: number;
  brand?: string;
  name?: string;
  code: string;
  message: string;
  outcome?: "skipped" | "warning" | "failed" | "partial_success";
  stage?: string;
};

export type ParsedCsvRecord = {
  values: Record<string, string>;
  recordNumber: number;
  sourceLineStart: number;
  sourceLineEnd: number;
};

export type ParsedCsvDocument = {
  headers: string[];
  headerLineStart: number;
  headerLineEnd: number;
  records: ParsedCsvRecord[];
};

export type CsvImportResult = {
  ok: boolean;
  importType: "products" | "offers" | "prices";
  message: string;
  totals: {
    received: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    warnings?: number;
    partialSuccess?: number;
  };
  errors: CsvRowError[];
  durationMs: number;
  processed: number;
  created: number;
  updated: number;
  skipped?: number;
  updatedOffers?: number;
  importId?: number;
};
