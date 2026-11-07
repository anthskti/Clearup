"use client";

import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productListFilters";
import PaginationControls from "@/components/pagination/PaginationControls";

export default function ProductCatalogPagination({
  page,
  total,
  onPage,
  pending = false,
  disabled = false,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
  pending?: boolean;
  disabled?: boolean;
}) {
  const lastPage = Math.max(1, Math.ceil(total / PRODUCT_CATALOG_PAGE_SIZE));

  return (
    <PaginationControls
      page={page}
      lastPage={lastPage}
      onPage={onPage}
      pending={pending}
      disabled={disabled}
      label="Product pages"
    />
  );
}
