"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, List, Loader2, Plus, Sparkles } from "lucide-react";
import RoutinePreviewCard, {
  estimatedPriceFromRoutineProducts,
  previewUrlsFromRoutineProducts,
} from "@/components/guides/RoutinePreviewCard";
import CreatedRoutineRow from "@/components/routine/CreatedRoutineRow";
import ProceduralWave from "@/components/themes/ProceduralWave";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AuthSessionUnavailable } from "@/components/AuthSessionUnavailable";
import { getSessionRetryAt, isTemporaryAuthError } from "@/lib/auth-retry";
import { getMyRoutines } from "@/lib/routines";
import type { RoutineWithProducts } from "@/types/routine";

export default function CreatedRoutinesPage() {
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const [routines, setRoutines] = useState<RoutineWithProducts[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isListView, setIsListView] = useState(false);

  useEffect(() => {
    if (isPending || sessionError || !userId) return;
    let active = true;

    async function fetchRoutines() {
      try {
        const data = await getMyRoutines();
        if (active) setRoutines([...(data ?? [])].reverse());
      } catch {
        if (active) setError("We couldn’t load your routines. Please try again.");
      } finally {
        if (active) setIsLoadingRoutines(false);
      }
    }

    fetchRoutines();
    return () => {
      active = false;
    };
  }, [userId, isPending, sessionError, retryCount]);

  useEffect(() => {
    if (!isPending && (sessionError?.status === 401 || (!session && !sessionError))) {
      router.push("/login");
    }
  }, [isPending, sessionError, session, router]);

  function retryLoading() {
    setError("");
    setIsLoadingRoutines(true);
    setRetryCount((count) => count + 1);
  }
  if (sessionError && isTemporaryAuthError(sessionError)) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-12 sm:px-6">
        <AuthSessionUnavailable
          retryAt={getSessionRetryAt()}
          onRetry={refetch}
        />
      </div>
    );
  }
  if (sessionError?.status === 403) {
    return <div className="p-10 text-center">Your account cannot access this page.</div>;
  }

  const isLoading = isPending || !userId || isLoadingRoutines;

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
        <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Created routines
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Your skincare routines, ready to revisit and share.
            </p>
          </div>
          <Button asChild variant="secondary" className="min-h-11">
            <Link href="/builder">
              <Plus className="size-4" aria-hidden="true" />
              New routine
            </Link>
          </Button>
        </header>

        {isLoading ? (
          <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-zinc-600">
            <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Loading your routines…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center">
            <p role="alert" className="text-sm text-zinc-600">{error}</p>
            <Button variant="secondary" className="mt-5 min-h-11" onClick={retryLoading}>
              Retry
            </Button>
          </div>
        ) : routines.length === 0 ? (
          <section aria-labelledby="empty-routines-title" className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center sm:py-16">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Sparkles className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 id="empty-routines-title" className="mt-5 text-xl font-semibold tracking-tight text-zinc-900">
              No routines yet
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-600">
              Choose products and add your notes in the builder to create your first routine.
            </p>
            <Button asChild variant="secondary" className="mt-6 min-h-11">
              <Link href="/builder">Build a routine</Link>
            </Button>
          </section>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-500">
                {routines.length} {routines.length === 1 ? "routine" : "routines"}
              </p>
              <div role="group" aria-label="Routine layout" className="hidden rounded-lg border border-zinc-200 bg-zinc-100 p-1 md:flex">
                <button
                  type="button"
                  aria-pressed={!isListView}
                  onClick={() => setIsListView(false)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${!isListView ? "bg-white text-brand shadow-sm" : "text-zinc-600 hover:bg-white/60"}`}
                >
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  Grid
                </button>
                <button
                  type="button"
                  aria-pressed={isListView}
                  onClick={() => setIsListView(true)}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none ${isListView ? "bg-white text-brand shadow-sm" : "text-zinc-600 hover:bg-white/60"}`}
                >
                  <List className="size-4" aria-hidden="true" />
                  List
                </button>
              </div>
            </div>
            <div
              className={isListView
                ? "grid auto-rows-fr gap-4 sm:grid-cols-3 md:block md:space-y-3"
                : "grid auto-rows-fr gap-4 sm:grid-cols-3"}
            >
              {routines.map((routine) => (
                <div key={routine.id}>
                  {isListView && (
                    <div className="hidden md:block">
                      <CreatedRoutineRow routine={routine} />
                    </div>
                  )}
                  <RoutinePreviewCard
                    routineId={routine.id}
                    name={routine.name}
                    authorLabel={routine.author?.name?.trim()}
                    skinTypeTags={routine.skinTypeTags ?? []}
                    previewImageUrls={previewUrlsFromRoutineProducts(routine)}
                    estimatedTotalPrice={estimatedPriceFromRoutineProducts(routine)}
                    className={isListView ? "md:hidden" : undefined}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
