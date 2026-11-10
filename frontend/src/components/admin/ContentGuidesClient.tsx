"use client";

import { useMemo, useState, type FormEvent } from "react";
import RoutinePreviewCard from "@/components/guides/RoutinePreviewCard";
import { getFeaturedRoutineCandidate } from "@/lib/routines";
import type { FeaturedRoutine } from "@/types/routine";
import type { FeaturedRoutineCandidate } from "@/types/routine-admin";
import { saveFeaturedRoutineOrder } from "@/app/admin/content/actions";

function asCandidate(routine: FeaturedRoutine): FeaturedRoutineCandidate {
  return {
    routineId: routine.routineId,
    name: routine.name,
    authorLabel: routine.author?.name?.trim() ?? "",
    skinTypeTags: routine.skinTypeTags ?? [],
    previewImageUrls: routine.previewImageUrls ?? [],
    estimatedTotalPrice: routine.estimatedTotalPrice ?? 0,
  };
}

function parseRoutineId(input: string): number | null {
  const value = input.trim();
  if (/^\d+$/.test(value)) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  try {
    const path = new URL(value, window.location.origin).pathname;
    const match = path.match(/\/routine\/(\d+)(?:\/|$)/i);
    if (!match) return null;
    const id = Number(match[1]);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export function ContentGuidesClient({
  initialFeatured,
  featuredLimit,
}: {
  initialFeatured: FeaturedRoutine[];
  featuredLimit: number;
}) {
  const initialDraft = useMemo(() => initialFeatured.map(asCandidate), [initialFeatured]);
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft);
  const [candidate, setCandidate] = useState<FeaturedRoutineCandidate | null>(null);
  const [search, setSearch] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isDirty = draft.map((item) => item.routineId).join(",") !== saved.map((item) => item.routineId).join(",");

  const findRoutine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLookupError(null);
    setError(null);
    setMessage(null);
    setCandidate(null);
    const routineId = parseRoutineId(search);
    if (!routineId) {
      setLookupError("Enter a routine ID or a URL like /routine/123.");
      return;
    }
    if (draft.some((item) => item.routineId === routineId)) {
      setLookupError("That routine is already in the featured list.");
      return;
    }
    setSearching(true);
    try {
      setCandidate(await getFeaturedRoutineCandidate(routineId));
    } catch (cause: unknown) {
      setLookupError(cause instanceof Error ? cause.message : "Could not find that routine.");
    } finally {
      setSearching(false);
    }
  };

  const addCandidate = () => {
    if (!candidate || draft.length >= featuredLimit) return;
    setDraft((current) => [...current, candidate]);
    setCandidate(null);
    setSearch("");
    setError(null);
    setLookupError(null);
    setMessage(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    setDraft((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setMessage(null);
  };

  const discard = () => {
    setDraft(saved);
    setCandidate(null);
    setSearch("");
    setError(null);
    setLookupError(null);
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const result = await saveFeaturedRoutineOrder(draft.map((item) => item.routineId));
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(draft);
      setMessage("Featured routines saved.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Could not save featured routines.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Find a routine</h2>
        <form onSubmit={findRoutine} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="routine-search" className="sr-only">Routine ID or URL</label>
          <input id="routine-search" value={search} onChange={(event) => { setSearch(event.target.value); setCandidate(null); setLookupError(null); }}
            placeholder="Routine ID or URL (for example /routine/123)" autoComplete="off"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4b84] sm:text-sm" />
          <button type="submit" disabled={searching} className="min-h-11 rounded-lg bg-[#0e4b84] px-4 text-sm font-medium text-white hover:bg-[#0b3c6a] disabled:opacity-60">{searching ? "Looking up…" : "Preview routine"}</button>
        </form>
        {lookupError && <p role="alert" className="mt-2 text-sm text-red-700">{lookupError}</p>}
        {candidate && (
          <div className="mt-4 max-w-sm">
            <RoutinePreviewCard {...candidate} buttonLabel="Routine preview" showFeaturedStar />
            <button type="button" onClick={addCandidate} disabled={draft.length >= featuredLimit || saving}
              className="mt-3 min-h-11 w-full rounded-lg border border-[#0e4b84] px-4 text-sm font-medium text-[#0e4b84] hover:bg-blue-50 disabled:opacity-50">
              {draft.length >= featuredLimit ? "Featured list is full" : "Add to featured draft"}
            </button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Homepage featured routines</h2>
          <p className="text-sm text-zinc-500">{draft.length} / {featuredLimit}</p>
        </div>
        {draft.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">No routines in the featured draft yet.</p>
        ) : (
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {draft.map((routine, index) => (
              <li key={routine.routineId} className="min-w-0 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Position {index + 1}</p>
                <RoutinePreviewCard {...routine} className="h-auto" showFeaturedStar />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => move(index, -1)} disabled={saving || index === 0}
                    className="min-h-11 rounded-lg border border-zinc-200 px-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">Move earlier</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={saving || index === draft.length - 1}
                    className="min-h-11 rounded-lg border border-zinc-200 px-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">Move later</button>
                  <button type="button" onClick={() => { setDraft((current) => current.filter((item) => item.routineId !== routine.routineId)); setMessage(null); }} disabled={saving}
                    className="col-span-2 min-h-11 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40">Remove from draft</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {isDirty && <p className="text-sm font-medium text-amber-800">Unsaved changes</p>}
      {(error || message) && <p role={error ? "alert" : "status"} className={`rounded-lg px-4 py-3 text-sm ${error ? "border border-red-200 bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{error ?? message}</p>}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-zinc-200 bg-white py-3">
        <button type="button" onClick={discard} disabled={saving || !isDirty} className="min-h-11 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">Discard edits</button>
        <button type="button" onClick={save} disabled={saving || !isDirty} className="min-h-11 rounded-lg bg-[#0e4b84] px-5 text-sm font-semibold text-white hover:bg-[#0b3c6a] disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button>
      </div>
    </div>
  );
}
