import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import ProceduralWave from "@/components/themes/ProceduralWave";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Saved products | Clearup",
  description: "A place to keep skincare products you want to revisit.",
};

export default function SavedProductsPage() {
  return (
    <div className="relative min-h-screen bg-[#F8F8F8]">
      <ProceduralWave
        seed={7}
        height={160}
        gradientFrom="#e9f6ff"
        gradientTo="#f0f8fc"
        flip
      />
      <div className="relative z-1 mx-auto max-w-6xl px-4 pt-34 pb-20 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Saved products
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-600">
            Keep the skincare you’re considering close at hand.
          </p>
        </header>

        <section
          aria-labelledby="saved-products-title"
          className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center sm:py-16"
        >
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <Bookmark className="size-6" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h2 id="saved-products-title" className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
            A place for your next find
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-600">
            Product saving is coming soon. In the meantime, explore the catalog
            to find products for your routine.
          </p>
          <Button asChild variant="secondary" className="mt-6 min-h-11">
            <Link href="/products">Browse products</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
