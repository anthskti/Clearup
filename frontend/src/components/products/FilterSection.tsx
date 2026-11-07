"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";

export type FilterSectionAppearance = "rail" | "sheet";

export interface FilterSectionProps {
  id: string;
  instanceId: string;
  appearance: FilterSectionAppearance;
  title: string;
  selectedCount: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function FilterSection({
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
          ? "border-b border-zinc-100 py-1 last:border-0"
          : "border-b border-zinc-200 pb-4"
      }
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${instanceId}-${id}-content`}
        className={`group flex w-full items-center justify-between text-left ${appearance === "rail" ? "min-h-10" : "min-h-11"}`}
      >
        <span
          className={`transition-colors group-hover:text-zinc-900 ${appearance === "rail" ? "text-[13px] font-medium text-zinc-600" : "text-sm font-semibold text-zinc-700"}`}
        >
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
          className={
            appearance === "rail" ? "mt-1 space-y-0.5" : "mt-2 space-y-1"
          }
        >
          {children}
        </div>
      )}
    </div>
  );
}
