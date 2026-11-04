"use client";

import { useState } from "react";
import { ChevronDown, Minus, Plus } from "lucide-react";
import {
  CATEGORY_CONFIG,
  ALL_PRODUCTS_CONFIG,
  CategoryKey,
  type FilterOption,
} from "@/constants/filters";
import { PRODUCT_PRICE_SLIDER_MAX } from "@/constants/productFilters";
import type { CatalogScope } from "@/hooks/useProductCatalog";
import { ROUTINE_SKIN_TYPE_OPTIONS } from "@/lib/routineSkinTypeTags";
import {
  skinTypeLabel,
  toggleAttributeFilter,
  toggleBrandFilter,
  toggleSkinTypeFilter,
} from "@/lib/productListFilters";
import type { ProductListFilters } from "@/types/product";
import PriceRangeFilter from "@/components/filters/PriceRangeFilter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterSectionProps {
  id: string;
  instanceId: string;
  appearance: "rail" | "sheet";
  title: string;
  selectedCount: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({
  id,
  instanceId,
  appearance,
  title,
  selectedCount,
  isOpen,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div
      className={
        appearance === "rail"
          ? "border-b border-zinc-100 py-2 last:border-0"
          : "border-b border-zinc-200 pb-4"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${instanceId}-${id}-content`}
        className="group flex min-h-11 w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold text-zinc-700 transition-colors group-hover:text-zinc-900">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {appearance === "rail" && selectedCount > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-[#0e4a84]">
              {selectedCount}
            </span>
          )}
          {appearance === "rail" ? (
            <ChevronDown
              size={16}
              className={`text-zinc-400 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          ) : isOpen ? (
            <Minus size={16} className="text-zinc-400" aria-hidden="true" />
          ) : (
            <Plus size={16} className="text-zinc-400" aria-hidden="true" />
          )}
        </span>
      </button>
      {isOpen && (
        <div
          id={`${instanceId}-${id}-content`}
          className={appearance === "rail" ? "mt-1 space-y-0.5" : "mt-2 space-y-1"}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface CheckboxOptionProps {
  appearance: "rail" | "sheet";
  label: string;
  checked: boolean;
  onChange: () => void;
}

function CheckboxOption({ appearance, label, checked, onChange }: CheckboxOptionProps) {
  return (
    <label
      className={
        appearance === "rail"
          ? "-mx-2 flex min-h-9 cursor-pointer items-center gap-3 rounded-md px-2 text-sm text-zinc-700 hover:bg-blue-50/60"
          : "flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-700 hover:text-[#0e4a84]"
      }
    >
      <Checkbox checked={checked} onChange={onChange} />
      <span className="capitalize">{label}</span>
    </label>
  );
}

interface ProductListFiltersSidebarProps {
  instanceId: string;
  appearance: "rail" | "sheet";
  scope: CatalogScope;
  filters: ProductListFilters;
  onFiltersChange: (filters: ProductListFilters) => void;
  draftPriceRange: [number, number];
  onDraftPriceChange: (range: [number, number]) => void;
  onApplyPrice: () => void;
  hasPriceDraftChanges: boolean;
  availableBrands: string[];
  showPriceApply?: boolean;
}

export default function ProductListFiltersSidebar({
  instanceId,
  appearance,
  scope,
  filters,
  onFiltersChange,
  draftPriceRange,
  onDraftPriceChange,
  onApplyPrice,
  hasPriceDraftChanges,
  availableBrands,
  showPriceApply = true,
}: ProductListFiltersSidebarProps) {
  const config =
    scope.type === "all"
      ? ALL_PRODUCTS_CONFIG
      : (CATEGORY_CONFIG[scope.slug as CategoryKey] ?? CATEGORY_CONFIG.default);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderAttributeSection = (filter: FilterOption) => {
    const selected = filters.attributes[filter.id] ?? [];
    return (
      <FilterSection
        key={filter.id}
        id={filter.id}
        instanceId={instanceId}
        appearance={appearance}
        title={filter.labels}
        selectedCount={selected.length}
        isOpen={openSections[filter.id] ?? false}
        onToggle={() => toggleSection(filter.id)}
      >
        {filter.options.map((opt) => {
          const value = opt.trim();
          return (
            <CheckboxOption
              key={`${filter.id}-${value}`}
              appearance={appearance}
              label={value}
              checked={selected.includes(value)}
              onChange={() =>
                onFiltersChange(
                  toggleAttributeFilter(filters, filter.id, value),
                )
              }
            />
          );
        })}
      </FilterSection>
    );
  };

  return (
    <div className={appearance === "rail" ? "" : "space-y-5"}>
      <FilterSection
        id="skinType"
        instanceId={instanceId}
        appearance={appearance}
        title="Skin type"
        selectedCount={filters.skinTypes.length}
        isOpen={openSections.skinType ?? true}
        onToggle={() => toggleSection("skinType")}
      >
        {ROUTINE_SKIN_TYPE_OPTIONS.map((skinType) => (
          <CheckboxOption
            key={skinType}
            appearance={appearance}
            label={skinTypeLabel(skinType)}
            checked={filters.skinTypes.includes(skinType)}
            onChange={() =>
              onFiltersChange(toggleSkinTypeFilter(filters, skinType))
            }
          />
        ))}
      </FilterSection>

      {availableBrands.length > 0 && (
        <FilterSection
          id="brand"
          instanceId={instanceId}
          appearance={appearance}
          title="Brand"
          selectedCount={filters.brands.length}
          isOpen={openSections.brand ?? false}
          onToggle={() => toggleSection("brand")}
        >
          <div className={appearance === "rail" ? "max-h-56 overflow-y-auto" : ""}>
            {availableBrands.map((brand) => (
              <CheckboxOption
                key={brand}
                appearance={appearance}
                label={brand}
                checked={filters.brands.includes(brand)}
                onChange={() =>
                  onFiltersChange(toggleBrandFilter(filters, brand))
                }
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection
        id="price"
        instanceId={instanceId}
        appearance={appearance}
        title={appearance === "rail" ? "Price (CAD)" : "Price"}
        selectedCount={
          filters.minPrice > 0 || filters.maxPrice < PRODUCT_PRICE_SLIDER_MAX
            ? 1
            : 0
        }
        isOpen={openSections.price ?? false}
        onToggle={() => toggleSection("price")}
      >
        <PriceRangeFilter
          idPrefix={`${instanceId}-product-price`}
          title="Catalog price (CAD)"
          value={draftPriceRange}
          onChange={onDraftPriceChange}
          sliderMax={PRODUCT_PRICE_SLIDER_MAX}
          step={1}
          size="compact"
          hideTitle={appearance === "rail"}
        />
        {showPriceApply && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-full"
            onClick={onApplyPrice}
            disabled={!hasPriceDraftChanges}
          >
            Apply price
          </Button>
        )}
      </FilterSection>

      {config.specificFilters.map(renderAttributeSection)}
    </div>
  );
}
