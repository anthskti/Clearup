import PaginationControls from "@/components/pagination/PaginationControls";

export function buildGuidesHref(
  page: number,
  tags: string,
  minPrice: string,
  maxPrice: string,
): string {
  const params = new URLSearchParams();
  if (tags.trim()) params.set("tags", tags.trim());
  if (minPrice.trim()) params.set("minPrice", minPrice.trim());
  if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/routines?${query}` : "/routines";
}

export default function GuidesPagination({
  page,
  total,
  tags,
  minPrice,
  maxPrice,
  pending,
  onPage,
}: {
  page: number;
  total: number;
  tags: string;
  minPrice: string;
  maxPrice: string;
  pending: boolean;
  onPage: (page: number) => void;
}) {
  const lastPage = Math.max(1, Math.ceil(total / 24));

  return (
    <PaginationControls
      page={page}
      lastPage={lastPage}
      pending={pending}
      hrefForPage={(nextPage) =>
        buildGuidesHref(nextPage, tags, minPrice, maxPrice)
      }
      onPage={onPage}
      label="Guides pagination"
    />
  );
}
