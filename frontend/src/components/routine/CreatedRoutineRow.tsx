import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import {
  estimatedPriceFromRoutineProducts,
  previewUrlsFromRoutineProducts,
} from "@/components/guides/RoutinePreviewCard";
import ProductImage from "@/components/ui/ProductImage";
import { skinTypeLabel } from "@/lib/routineSkinTypeTags";
import type { RoutineWithProducts } from "@/types/routine";

export default function CreatedRoutineRow({
  routine,
}: {
  routine: RoutineWithProducts;
}) {
  const previewUrls = previewUrlsFromRoutineProducts(routine);
  const estimatedTotal = estimatedPriceFromRoutineProducts(routine);
  const productCount = routine.products?.length ?? 0;
  const skinTypes = (routine.skinTypeTags ?? []).map(skinTypeLabel).join(" · ");

  return (
    <article>
      <Link
        href={`/routine/${routine.id}`}
        className="group/row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-4 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none lg:grid-cols-[minmax(0,1fr)_240px_auto]"
      >
        <div className="min-w-0">
          <h3
            className="line-clamp-2 break-words text-base font-semibold leading-snug text-zinc-900 group-hover/row:text-brand"
            title={routine.name}
          >
            {routine.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {productCount} {productCount === 1 ? "product" : "products"}
            {skinTypes && <span className="text-zinc-600"> · {skinTypes}</span>}
          </p>
        </div>

        <div
          className="col-start-1 row-start-2 flex min-h-14 items-center gap-2 lg:col-start-auto lg:row-start-auto"
          aria-label="Product preview"
        >
          {previewUrls.length > 0 ? (
            previewUrls.map((url, index) => (
              <div
                key={`${routine.id}-${index}`}
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
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <FlaskConical className="size-6 text-zinc-400" aria-hidden="true" />
              Product preview unavailable
            </div>
          )}
        </div>

        <div className="col-start-2 row-span-2 row-start-1 text-right lg:col-start-auto lg:row-span-1 lg:row-start-auto">
          <p className="text-xs text-zinc-500">Estimated</p>
          <p className="mt-1 text-sm font-semibold text-zinc-800">CA ${estimatedTotal.toFixed(0)}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand">
            View routine
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
