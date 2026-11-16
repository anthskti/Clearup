import type { ProductCategory, SkinType } from "../types/product";
import type { ParsedCsvDocument, ParsedCsvRecord } from "../types/csv";

const VALID_CATEGORIES = new Set<ProductCategory>([
  "cleanser",
  "toner",
  "essence",
  "serum",
  "eyecare",
  "moisturizer",
  "sunscreen",
  "other",
]);

const VALID_SKIN_TYPES = new Set<SkinType>([
  "oily",
  "dry",
  "combination",
  "sensitive",
  "normal",
  "acne-prone",
]);

/** RFC 4180-style parser for pasted scraper CSV (quoted fields, commas inside quotes). */
export function parseCsvText(csvText: string): Record<string, string>[] {
  return parseCsvTextWithMetadata(csvText).map((record) => record.values);
}

export class CsvParseError extends Error {
  constructor(
    message: string,
    readonly sourceLineStart: number,
    readonly sourceLineEnd: number,
    readonly recordNumber = 0,
  ) {
    super(message);
    this.name = "CsvParseError";
  }
}

export function parseCsvTextWithMetadata(csvText: string): ParsedCsvRecord[] {
  return parseCsvDocument(csvText).records;
}

export function parseCsvDocument(csvText: string): ParsedCsvDocument {
  const text = csvText.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const table: string[][] = [];
  const locations: Array<{ start: number; end: number }> = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;
  let rowHadContent = false;
  let physicalLine = 1;
  let rowStart = 1;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (afterQuote && c !== "," && c !== "\n") {
      throw new CsvParseError("Malformed CSV: unexpected text after a quoted field.", rowStart, physicalLine, Math.max(0, table.length));
    }
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (inQuotes) {
        inQuotes = false;
        afterQuote = true;
      } else if (field.length === 0 && !afterQuote) {
        inQuotes = true;
        rowHadContent = true;
      } else {
        throw new CsvParseError("Malformed CSV: quote inside an unquoted field.", rowStart, physicalLine, Math.max(0, table.length));
      }
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
      afterQuote = false;
      rowHadContent = true;
    } else if (c === "\n" && !inQuotes) {
      row.push(field);
      field = "";
      if (rowHadContent) {
        table.push(row);
        locations.push({ start: rowStart, end: physicalLine });
      }
      row = [];
      rowHadContent = false;
      afterQuote = false;
      physicalLine += 1;
      rowStart = physicalLine;
    } else if (c === "\n") {
      field += c;
      physicalLine += 1;
    } else {
      field += c;
      rowHadContent = true;
    }
  }
  if (inQuotes) {
    throw new CsvParseError("Malformed CSV: a quoted field was not closed.", rowStart, physicalLine, Math.max(0, table.length));
  }
  row.push(field);
  if (rowHadContent) {
    table.push(row);
    locations.push({ start: rowStart, end: physicalLine });
  }

  if (table.length === 0) {
    return { headers: [], headerLineStart: 1, headerLineEnd: 1, records: [] };
  }

  const headers = table[0].map((h, index) => (index === 0 ? h.replace(/^\uFEFF/, "") : h).trim().toLowerCase());
  const headerLocation = locations[0] ?? { start: 1, end: 1 };
  const invalidHeader = headers.findIndex((header) => !header);
  if (invalidHeader !== -1) {
    throw new CsvParseError("Malformed CSV: a header name is empty.", headerLocation.start, headerLocation.end);
  }
  if (new Set(headers).size !== headers.length) {
    throw new CsvParseError("Malformed CSV: header names must be unique.", headerLocation.start, headerLocation.end);
  }

  const records = table.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      const location = locations[index + 1] ?? { start: index + 2, end: index + 2 };
      throw new CsvParseError("Malformed CSV: a record has a different number of fields than the header.", location.start, location.end, index + 1);
    }
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      record[header] = (values[idx] ?? "").trim();
    });
    const location = locations[index + 1];
    return {
      values: record,
      recordNumber: index + 1,
      sourceLineStart: location?.start ?? index + 2,
      sourceLineEnd: location?.end ?? index + 2,
    };
  });
  return {
    headers,
    headerLineStart: headerLocation.start,
    headerLineEnd: headerLocation.end,
    records,
  };
}

export function parseLabels(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function parseSkinTypes(raw: string | undefined): SkinType[] {
  if (!raw?.trim()) return [];
  const normalized = raw.trim().toLowerCase();
  if (normalized === "n/a" || normalized === "na" || normalized === "-") {
    return [];
  }
  const out: SkinType[] = [];
  for (const part of raw.split(/[,;|]/)) {
    const value = part.trim().toLowerCase();
    if (VALID_SKIN_TYPES.has(value as SkinType)) {
      out.push(value as SkinType);
    }
  }
  return out;
}

function stripCurrencyPrefix(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/^(?:CAD|CA\$?|\$)\s*/i, "");
}

export function parseScraperPrice(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return 0;
  const value = stripCurrencyPrefix(raw);
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && (price >= 0 || price === -1)
    ? price
    : undefined;
}

/** Merchant offer CSV prices: undefined is invalid, null is the -1 sentinel. */
export function parseOfferPrice(raw: string | undefined): number | null | undefined {
  const value = raw ? stripCurrencyPrefix(raw) : "";
  if (value === "-1") return null;
  if (!value) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

export function parseOfferStock(raw: string | undefined): boolean | undefined {
  const value = raw?.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return undefined;
}

// Periods in these tokens must not start a new instruction step (e.g. "Dr. Althea").
// Extend when scraper copy includes other dotted names or abbreviations.
const INSTRUCTION_PERIOD_EXCEPTIONS = [
  "Dr",
  "Mr",
  "Mrs",
  "Ms",
  "Mx",
  "Sr",
  "Jr",
  "St",
  "Co",
  "Inc",
  "Ltd",
  "vs",
  "etc",
] as const;

const INSTRUCTION_STEP_SPLIT = new RegExp(
  `(?<!(?:${INSTRUCTION_PERIOD_EXCEPTIONS.map((abbr) =>
    abbr.replace(/\./g, "\\."),
  ).join("|")}))\\.\\s+`,
  "gi",
);

export function parseInstructions(raw: string | undefined): string[] {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return [];

  const segments = trimmed
    .split(INSTRUCTION_STEP_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length <= 1) {
    return [trimmed];
  }

  return segments.map((seg) => (seg.endsWith(".") ? seg : `${seg}.`));
}

export function parseImageUrls(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const trimmed = raw.trim();

  // Used for image seperation in the scraper
  if (trimmed.includes("|")) {
    return trimmed
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Comma-separated absolute URLs (e.g. The Ordinary scraper rows).
  // Split only before "http(s)://" so query-string commas stay intact.
  if (/,https?:\/\//i.test(trimmed)) {
    return trimmed
      .split(/,(?=https?:\/\/)/i)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [trimmed];
}

// Expands pipe/comma-joined strings stored as a single array element.
export function normalizeImageUrls(value: unknown): string[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") return parseImageUrls(value);
    return [];
  }

  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    out.push(...parseImageUrls(item));
  }
  return out;
}

export function parseCategory(raw: string | undefined): ProductCategory | null {
  const value = raw?.trim().toLowerCase();
  if (!value) return null;
  if (VALID_CATEGORIES.has(value as ProductCategory)) {
    return value as ProductCategory;
  }
  return null;
}

export function isScraperRowSuccessful(status: string | undefined): boolean {
  const s = status?.trim().toLowerCase();
  if (!s) return true;
  return s === "success";
}

export const SCRAPER_DEFAULT_MERCHANT_NAME = "YesStyle";

/** CSV `merchant` column; falls back to YesStyle when blank. */
export function parseMerchantName(raw: string | undefined): string {
  const trimmed = raw?.trim();
  return trimmed || SCRAPER_DEFAULT_MERCHANT_NAME;
}
