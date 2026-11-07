"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical, Star } from "lucide-react";
import type { SkinType } from "@/types/product";
import type { RoutineWithProducts } from "@/types/routine";
import { skinTypeLabel } from "@/lib/routineSkinTypeTags";
import ProductImage from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

export function previewUrlsFromRoutineProducts(
  routine: RoutineWithProducts,
  max = 4,
): string[] {
  const out: string[] = [];
  for (const rp of routine.products ?? []) {
    const url = rp.product?.imageUrls?.[0];
    if (url) {
      out.push(url);
      if (out.length >= max) break;
    }
  }
  return out;
}

export function estimatedPriceFromRoutineProducts(
  routine: RoutineWithProducts,
): number {
  return (routine.products ?? []).reduce(
    (sum, rp) => sum + (rp.product?.price ?? 0),
    0,
  );
}

const cardShell =
  "group/card flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] motion-reduce:transition-none";

export type RoutinePreviewCardProps = {
  routineId: number;
  name: string;
  authorLabel?: string;
  skinTypeTags: SkinType[];
  previewImageUrls: string[];
  estimatedTotalPrice?: number;
  showFeaturedStar?: boolean;
  buttonLabel?: string;
  className?: string;
};

export default function RoutinePreviewCard({
  routineId,
  name,
  authorLabel,
  skinTypeTags,
  previewImageUrls,
  estimatedTotalPrice,
  showFeaturedStar = false,
  buttonLabel = "View routine",
  className,
}: RoutinePreviewCardProps) {
  const href = `/routine/${routineId}`;
  const showPrice =
    estimatedTotalPrice !== undefined && estimatedTotalPrice !== null;

  const authorText = authorLabel?.trim();

  return (
    <article className={cn("h-full", className)}>
      <Link href={href} className={cardShell}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3
              className="line-clamp-2 break-words text-base font-semibold leading-snug text-zinc-900 group-hover/card:text-[#0e4a84]"
              title={name}
            >{name}</h3>
            {authorText && <p className="mt-1 truncate text-xs text-zinc-500" title={`by ${authorText}`}>by {authorText}</p>}
          </div>
          {showFeaturedStar && <Star size={16} className="shrink-0 fill-amber-400 text-amber-500" aria-label="Featured routine" />}
        </div>
        <div className="my-4 flex min-h-14 items-center gap-2" aria-label="Product preview">
          {previewImageUrls.length > 0 ? previewImageUrls.slice(0, 4).map((url, i) => (
            <div
              key={`${routineId}-${i}`}
              className="size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-50 p-1"
            >
              <ProductImage
                src={url}
                alt=""
                width={48}
                height={48}
                sizes="48px"
                className="h-full w-full object-contain"
              />
            </div>
          )) : <div className="flex items-center gap-2 text-xs text-zinc-500"><FlaskConical size={24} className="text-zinc-400" aria-hidden="true" />Product preview unavailable</div>}
        </div>
        <p
          aria-hidden={skinTypeTags.length === 0}
          className="mb-3 min-h-[1.625em] text-xs leading-relaxed text-zinc-600"
        >
          {skinTypeTags.map(skinTypeLabel).join(" · ")}
        </p>
        <div
          className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs"
        >
          {showPrice && <span className="text-zinc-500">Estimated <span className="font-semibold text-zinc-800">CA ${estimatedTotalPrice.toFixed(0)}</span></span>}
          <span className="ml-auto inline-flex items-center gap-1 font-medium text-[#0e4a84]">{buttonLabel}<ArrowRight size={14} aria-hidden="true" /></span>
        </div>
      </Link>
    </article>
  );
}
