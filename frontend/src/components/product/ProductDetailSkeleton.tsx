import ProceduralWave from "@/components/themes/ProceduralWave";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailSkeleton() {
  return (
    <div className="relative mt-18 min-h-screen w-full bg-[#F8F8F8] pt-8" role="status" aria-live="polite">
      <span className="sr-only">Loading product details</span>
      <div aria-hidden="true">
        <ProceduralWave
          seed={20}
          height={140}
          offset={1}
          gradientFrom="#e9f6ff"
          gradientTo="#f0f8fc"
          flip
        />
        <main className="relative z-1 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col lg:col-span-7">
            <div className="mb-6">
              <Skeleton className="h-16 w-full max-w-2xl sm:h-10" />
              <Skeleton className="mt-2 h-4 w-36" />
            </div>
            <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-lg border border-zinc-100 bg-white p-4 shadow-md sm:flex-row sm:items-center">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-11 w-36 rounded-md" />
            </div>
            <div className="mb-6 space-y-6 border-t border-zinc-200 pt-4">
              <Skeleton className="h-7 w-40"/>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-24 max-w-full" />
                    <Skeleton className="h-5 w-32 max-w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-zinc-200 pt-4">
                <Skeleton className="h-7 w-32" />
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <Skeleton className="h-11 w-40" />
              </div>
            </div>
            <section className="mt-auto border-t border-zinc-200 pt-4">
              <Skeleton className="mb-4 h-7 w-48" />
              <div className="overflow-hidden rounded-lg bg-white">
                <div className="grid grid-cols-[23%_27%_25%_25%] border-b border-zinc-200 px-1 py-3 sm:px-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="px-1">
                      <Skeleton className="h-3 w-full max-w-16" />
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-zinc-100">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="grid grid-cols-[23%_27%_25%_25%] items-center px-1 py-4 sm:px-4">
                      <div className="flex min-w-0 flex-col items-center gap-1 px-1 sm:flex-row sm:gap-3">
                        <Skeleton className="size-5 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-full max-w-16" />
                      </div>
                      <div className="min-w-0 px-1">
                        <Skeleton className="h-4 w-full max-w-16" />
                      </div>
                      <div className="min-w-0 px-1 text-right">
                        <Skeleton className="ml-auto h-4 w-full max-w-14" />
                      </div>
                      <div className="min-w-0 px-1 text-right">
                        <Skeleton className="ml-auto h-8 w-full max-w-12 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
