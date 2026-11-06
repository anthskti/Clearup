/** Parse a 1-based page query while keeping its derived offset safe. */
export function parsePageParam(raw: unknown, pageSize: number): number {
  if (
    typeof raw !== "string" ||
    !/^\d+$/.test(raw) ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1
  ) {
    return 1;
  }

  const page = Number(raw);
  return Number.isSafeInteger(page) &&
    page > 0 &&
    Number.isSafeInteger((page - 1) * pageSize)
    ? page
    : 1;
}

/** Build desktop first/last pages with nearby siblings and ellipses. */
export function getPageWindow(
  current: number,
  last: number,
): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1);

  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });

  return result;
}

/** Phone pagination shows only the current page and its immediate neighbors. */
export function getMobilePageWindow(
  current: number,
  last: number,
): number[] {
  return [current - 1, current, current + 1].filter(
    (page) => page >= 1 && page <= last,
  );
}
