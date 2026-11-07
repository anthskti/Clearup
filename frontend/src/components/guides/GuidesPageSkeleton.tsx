import ProceduralWave from "@/components/themes/ProceduralWave";
import { Skeleton } from "@/components/ui/skeleton";

export default function GuidesPageSkeleton() {
  return (
    <div className="relative min-h-screen w-full bg-[#F8F8F8]" role="status" aria-live="polite">
      <span className="sr-only">Loading community routines</span>
      <div aria-hidden="true">
        <ProceduralWave
          seed={7}
          height={160}
          gradientFrom="#e9f6ff"
          gradientTo="#f0f8fc"
          flip
        />
        <div className="relative z-1 mx-auto max-w-7xl px-4 pt-34 pb-6 sm:px-6">
          <header className="mb-6">
            <Skeleton className="h-9 w-64" />
            <div className="mt-3">
              <Skeleton className="h-10 w-full max-w-2xl sm:h-5" />
            </div>
          </header>
          <div className="mb-3 h-11 xl:hidden">
            <Skeleton className="h-11 w-28 rounded-md" />
          </div>
          <div className="xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start xl:gap-8">
            <aside className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white xl:block">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-5 p-4">
                <div className="space-y-1">
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="mb-2 h-3 w-40" />
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex min-h-9 items-center gap-2">
                      <Skeleton className="size-4 shrink-0 rounded-sm" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="space-y-3 border-t border-zinc-100 pt-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
                    <Skeleton className="h-10 min-w-0 flex-1 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </aside>
            <main className="min-w-0">
              <Skeleton className="mb-3 h-7 w-40" />
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <article key={i} className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4">
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="mt-1 h-4 w-24" />
                    <div className="my-4 flex min-h-14 items-center gap-2">
                      {[0, 1, 2, 3].map((j) => (
                        <Skeleton key={j} className="size-14 shrink-0 rounded-lg" />
                      ))}
                    </div>
                    <Skeleton className="mb-3 h-5 w-2/3" />
                    <div className="mt-auto flex justify-between border-t border-zinc-100 pt-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </article>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
