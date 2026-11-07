import ProceduralWave from "@/components/themes/ProceduralWave";
import { Skeleton } from "@/components/ui/skeleton";

const SLOT_LABELS = [
  "Cleanser",
  "Toner",
  "Essence",
  "Serum",
  "Eye Care",
  "Moisturizer",
  "Sunscreen",
];

export default function BuilderSkeleton() {
  return (
    <div className="relative mt-18 min-h-screen w-full bg-[#F8F8F8]" role="status" aria-live="polite">
      <span className="sr-only">Loading routine builder</span>
      <div aria-hidden="true">
        <ProceduralWave
          seed={3}
          height={190}
          gradientFrom="#e9f6ff"
          gradientTo="#f0f8fc"
          flip
        />
        <div className="relative z-1 mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6">
          <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 max-w-full">
              <Skeleton className="h-9 w-64 max-w-full" />
              <Skeleton className="mt-2 h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-4 w-44" />
          </header>
          <div className="mb-2 hidden grid-cols-12 gap-4 border-b border-zinc-200 px-2 pb-2 text-sm font-semibold md:grid">
            <div className="col-span-2">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="col-span-7">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="col-span-1 flex justify-center">
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="col-span-2 flex justify-end">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
          <div className="space-y-4 md:space-y-0">
            {SLOT_LABELS.map((label) => (
              <div
                key={label}
                className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-12 md:items-center md:rounded-none md:border-0 md:border-b md:border-zinc-200 md:bg-transparent md:px-2 md:py-5 md:shadow-none"
              >
                <div className="md:col-span-2">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="md:col-span-7">
                  <div className="flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 md:h-16">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
                <div className="hidden md:col-span-1 md:block" />
                <div className="hidden md:col-span-2 md:block" />
              </div>
            ))}
          </div>
          <section className="mt-12 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-8">
            <Skeleton className="mb-2 h-6 w-36" />
            <Skeleton className="mb-6 h-4 w-72 max-w-full" />
            <div className="grid gap-8 md:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-52 max-w-full" />
                  <Skeleton className="h-11 w-28 rounded-md" />
                </div>
              ))}
            </div>
          </section>
          <section className="mt-8 w-full rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-md sm:px-6">
            <div className="mb-4">
              <Skeleton className="mb-2 h-4 w-20" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-32" />
              </div>
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
