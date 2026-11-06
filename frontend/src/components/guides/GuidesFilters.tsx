"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, SlidersHorizontal, X } from "lucide-react";
import type { SkinType } from "@/types/product";
import { ROUTINE_SKIN_TYPE_OPTIONS, skinTypeLabel } from "@/lib/routineSkinTypeTags";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PriceRangeFilter from "@/components/filters/PriceRangeFilter";
import ProductFiltersSheet from "@/components/products/ProductFiltersSheet";
import { formatPriceRangeLabel, toPriceRange } from "@/lib/priceRange";
import GuidesPagination, {
  buildGuidesHref,
} from "@/components/guides/GuidesPagination";

export const GUIDES_PRICE_SLIDER_MAX = 300;

export default function GuidesFilters({ initialTags, initialTagsParam, initialMinPrice, initialMaxPrice, page, total, loadError, children }: {
  initialTags: SkinType[];
  initialTagsParam: string;
  initialMinPrice: string;
  initialMaxPrice: string;
  page: number;
  total: number;
  loadError: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const paginationIntent = useRef<{ fromPage: number } | null>(null);
  const appliedPrice = toPriceRange(initialMinPrice, initialMaxPrice, GUIDES_PRICE_SLIDER_MAX);
  const [tags, setTags] = useState(initialTags);
  const [priceRange, setPriceRange] = useState<[number, number]>(appliedPrice);
  const [open, setOpen] = useState(false);
  const hasPrice = appliedPrice[0] > 0 || appliedPrice[1] < GUIDES_PRICE_SLIDER_MAX;
  const activeCount = initialTags.length + Number(hasPrice);
  const draftCount = tags.length + Number(priceRange[0] > 0 || priceRange[1] < GUIDES_PRICE_SLIDER_MAX);

  function navigate(nextTags: SkinType[], range: [number, number]) {
    paginationIntent.current = null;
    const params = new URLSearchParams();
    if (nextTags.length) params.set("tags", nextTags.join(","));
    if (range[0] > 0) params.set("minPrice", String(range[0]));
    if (range[1] < GUIDES_PRICE_SLIDER_MAX) params.set("maxPrice", String(range[1]));
    startTransition(() => router.push(params.size ? `/routines?${params}` : "/routines"));
  }

  function navigatePage(nextPage: number) {
    if (pending || nextPage === page) return;
    paginationIntent.current = { fromPage: page };
    startTransition(() =>
      router.push(
        buildGuidesHref(
          nextPage,
          initialTagsParam,
          initialMinPrice,
          initialMaxPrice,
        ),
        { scroll: false },
      ),
    );
  }

  useEffect(() => {
    if (pending) return;
    const intent = paginationIntent.current;
    if (!intent) return;

    if (!loadError && page !== intent.fromPage) {
      const heading = document.getElementById("guides-results-heading");
      if (heading) {
        const top = Math.max(
          0,
          window.scrollY + heading.getBoundingClientRect().top - 72,
        );
        window.scrollTo({ top, behavior: "auto" });
        heading.focus({ preventScroll: true });
      }
    }
    paginationIntent.current = null;
  }, [loadError, page, pending]);

  useEffect(() => {
    const clearPaginationIntent = () => {
      paginationIntent.current = null;
    };
    window.addEventListener("popstate", clearPaginationIntent);
    return () => window.removeEventListener("popstate", clearPaginationIntent);
  }, []);

  function resetDraft() {
    setTags([]);
    setPriceRange([0, GUIDES_PRICE_SLIDER_MAX]);
  }

  function controls(instance: "desktop" | "mobile") {
    return (
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-zinc-700">Skin type</legend>
          <p className="mb-2 text-xs text-zinc-500">Matches any selected skin type.</p>
          {ROUTINE_SKIN_TYPE_OPTIONS.map((tag) => (
            <label
              key={tag}
              className={`flex cursor-pointer items-center gap-2.5 text-sm text-zinc-600 ${instance === "desktop" ? "min-h-9" : "min-h-11"}`}
            >
              <Checkbox
                checked={tags.includes(tag)}
                onChange={() => setTags((current) => current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag])}
              />
              {skinTypeLabel(tag)}
            </label>
          ))}
        </fieldset>
        <section className="border-t border-zinc-100 pt-4" aria-label="Estimated routine total">
          <h2 className="mb-2 text-sm font-medium text-zinc-700">Routine total (CAD)</h2>
          <PriceRangeFilter
            idPrefix={`routines-${instance}`}
            title="Routine total (CAD)"
            hideTitle
            size="compact"
            value={priceRange}
            onChange={setPriceRange}
            sliderMax={GUIDES_PRICE_SLIDER_MAX}
            step={5}
          />
        </section>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => { setTags(initialTags); setPriceRange(appliedPrice); setOpen(true); }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] xl:hidden"
      >
        <SlidersHorizontal size={17} aria-hidden="true" /> Filters
        {activeCount > 0 && <span className="rounded-full bg-[#0e4a84] px-2 py-0.5 text-xs text-white">{activeCount}</span>}
      </button>
      {activeCount > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5" aria-label="Active filters">
          {initialTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => navigate(initialTags.filter((value) => value !== tag), appliedPrice)}
              aria-label={`Remove skin type filter: ${skinTypeLabel(tag)}`}
              className="inline-flex min-h-9 items-center gap-1 rounded-full bg-zinc-100 px-2.5 text-xs text-zinc-700 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-[#0e4a84] xl:min-h-8"
            >
              {skinTypeLabel(tag)} <X size={12} aria-hidden="true" />
            </button>
          ))}
          {hasPrice && <button
            type="button"
            onClick={() => navigate(initialTags, [0, GUIDES_PRICE_SLIDER_MAX])}
            aria-label="Remove routine total filter"
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-zinc-100 px-2.5 text-xs text-zinc-700 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-[#0e4a84] xl:min-h-8"
          >
            {formatPriceRangeLabel(appliedPrice, GUIDES_PRICE_SLIDER_MAX)} <X size={12} aria-hidden="true" />
          </button>}
        </div>
      )}
      {pending && (
        <p role="status" className="mb-3 flex items-center gap-2 text-sm text-zinc-600">
          <LoaderCircle
            size={16}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading results…
        </p>
      )}
      <div className="xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start xl:gap-8">
        <aside
          aria-label="Routine filters"
          className="hidden rounded-xl border border-zinc-200 bg-white xl:block"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-900">Filters</h2>
            {activeCount > 0 && <button
              type="button"
              onClick={() => { resetDraft(); navigate([], [0, GUIDES_PRICE_SLIDER_MAX]); }}
              className="text-xs font-medium text-[#0e4a84] hover:underline"
            >Clear</button>}
          </div>
          <div className="p-4">{controls("desktop")}
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => navigate(tags, priceRange)}
              className="mt-5 w-full"
            >{pending ? "Applying…" : "Apply filters"}</Button>
          </div>
        </aside>
        <div className="min-w-0">
          {loadError ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            >
              <p>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 min-h-11"
                disabled={pending}
                onClick={() => startTransition(() => router.refresh())}
              >
                {pending ? "Retrying…" : "Retry"}
              </Button>
            </div>
          ) : (
            <div aria-busy={pending}>
              <h2
                id="guides-results-heading"
                tabIndex={-1}
                className="mb-3 text-lg font-semibold text-zinc-900"
              >
                Community routines
              </h2>
              {children}
            </div>
          )}
          {!loadError && (
            <GuidesPagination
              page={page}
              total={total}
              tags={initialTagsParam}
              minPrice={initialMinPrice}
              maxPrice={initialMaxPrice}
              pending={pending}
              onPage={navigatePage}
            />
          )}
        </div>
      </div>
      <ProductFiltersSheet
        open={open}
        onOpenChange={setOpen}
        activeFilterCount={draftCount}
        onClear={resetDraft}
        onApply={() => { navigate(tags, priceRange); setOpen(false); }}
      >
        {controls("mobile")}
      </ProductFiltersSheet>
    </div>
  );
}
