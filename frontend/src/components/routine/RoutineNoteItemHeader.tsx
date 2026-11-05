import type { ProductCategory } from "@/types/product";

interface RoutineNoteItemHeaderProps {
  stepOrder: number;
  productName: string;
  productBrand: string;
  category: ProductCategory;
  variant?: "default" | "builder";
}

export default function RoutineNoteItemHeader({
  stepOrder,
  productName,
  productBrand,
  category,
  variant = "default",
}: RoutineNoteItemHeaderProps) {
  if (variant === "builder") {
    return (
      <div className="mb-2 flex items-start gap-3">
        <span className="pt-0.5 text-sm font-medium text-zinc-600" aria-label={`Step ${stepOrder}`}>{stepOrder}</span>
        <div className="min-w-0">
          <div className="text-sm leading-5">
            <span className="font-medium text-zinc-600">{productBrand}</span>{" "}
            <span aria-hidden="true" className="mx-1 mb-[0.12em] inline-block size-0.5 rounded-full bg-zinc-500 align-middle" />
            {" "}<span className="font-semibold text-zinc-900">{productName}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-600">{category === "eyecare" ? "Eye care" : category.charAt(0).toUpperCase() + category.slice(1)}</div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="font-bold text-zinc-900 text-sm">
        Step {stepOrder} · {productBrand}  {productName}
      </div>
      <div className="text-xs text-zinc-400 uppercase mb-1">
        {category}
      </div>
    </>
  );
}
