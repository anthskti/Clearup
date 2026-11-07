import ProceduralWave from "@/components/themes/ProceduralWave";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductListSkeleton() {
  return (
    <div className="relative mt-18 min-h-screen bg-[#F8F8F8] pt-8 pb-6" role="status" aria-live="polite">
      <span className="sr-only">Loading products</span>
      <div aria-hidden="true">
        <ProceduralWave
          seed={6}
          height={190}
          frequency={1.5}
          gradientFrom="#e9f6ff"
          gradientTo="#f0f8fc"
          flip
        />
        <div className="relative z-1 mx-auto max-w-7xl px-4 sm:px-6 xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start xl:gap-x-6">
          <header className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between xl:col-span-2">
            <Skeleton className="h-9 w-48" />
            <div className="w-full sm:max-w-md">
              <div className="flex gap-2">
                <Skeleton className="h-11 min-w-0 flex-1 rounded-md" />
                <Skeleton className="h-11 w-24 rounded-md" />
              </div>
              <Skeleton className="ml-auto mt-3 hidden h-4 w-40 xl:block" />
            </div>
          </header>

          <div className="mb-4 flex items-center justify-between gap-3 xl:hidden">
            <Skeleton className="h-11 w-28 rounded-md" />
            <Skeleton className="h-4 w-36" />
          </div>

          <aside className="hidden xl:block">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <Skeleton className="h-11 rounded-none border-b border-zinc-200" />
              <div className="space-y-5 p-4">
                {[0, 1, 2].map((group) => (
                  <div key={group} className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-sm" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <Skeleton className="mb-3 h-7 w-40" />
            <div className="space-y-3 lg:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                      <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-x-2.5 gap-y-3 border-t border-zinc-100 pt-3">
                      <div className="min-w-0 space-y-1.5">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="col-span-3 min-w-0 space-y-1.5">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                      {[0, 1].map((j) => (
                        <div key={`extra-${j}`} className="min-w-0 space-y-1.5">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-zinc-100 pt-2.5">
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm lg:block">
              <div className="grid h-11 grid-cols-12 items-center border-b border-zinc-200 bg-zinc-50 px-4">
                <div className="col-span-6 px-1">
                  <Skeleton className="h-4 w-20" />
                </div>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="col-span-1 px-1">
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ))}
              </div>
              <div className="divide-y divide-zinc-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-12 items-center px-4 py-3">
                    <div className="col-span-6 flex min-w-0 items-center gap-2.5 px-1">
                      <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="col-span-1 px-1">
                        <Skeleton className="mx-auto h-5 w-4/5" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
