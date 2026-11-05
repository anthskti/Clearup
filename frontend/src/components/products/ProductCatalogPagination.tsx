"use client";

import { Button } from "@/components/ui/button";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productListFilters";

function pageWindow(current: number, last: number): (number | "ellipsis")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => { if (i && p - sorted[i - 1] > 1) result.push("ellipsis"); result.push(p); });
  return result;
}

export default function ProductCatalogPagination({
  page,
  total,
  onPage,
  disabled = false,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}) {
  const last = Math.max(1, Math.ceil(total / PRODUCT_CATALOG_PAGE_SIZE));
  if (last <= 1) return null;
  return <nav aria-label="Product pages" className="flex flex-wrap items-center justify-center gap-2 py-8">
    <Button variant="outline" size="sm" aria-label="Previous page" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
    {pageWindow(page, last).map((item, i) => item === "ellipsis"
      ? <span key={`ellipsis-${i}`} aria-hidden="true" className="px-1 text-zinc-500">…</span>
      : <Button key={item} variant={item === page ? "default" : "outline"} size="sm" aria-label={`Page ${item}`} aria-current={item === page ? "page" : undefined} disabled={disabled} onClick={() => onPage(item)}>{item}</Button>)}
    <Button variant="outline" size="sm" aria-label="Next page" disabled={disabled || page >= last} onClick={() => onPage(page + 1)}>Next</Button>
  </nav>;
}
