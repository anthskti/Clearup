"use client";

import { memo, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkinType } from "@/types/product";
import RoutineShareLink from "./RoutineShareLink";

const emptySubscribe = () => () => {};

export type SaveRoutinePayload = {
  name: string;
  description: string;
  skinTypeTags: SkinType[];
};

interface SaveRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  skinTypeTags: SkinType[];
  onSave: (payload: SaveRoutinePayload) => Promise<number>;
}

function SaveRoutineModalBody({ onClose, skinTypeTags, onSave }: Omit<SaveRoutineModalProps, "isOpen">) {
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRoutineId, setSavedRoutineId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>("input")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.matches(":disabled")) {
        previousFocus.focus();
      } else {
        document.querySelector<HTMLElement>("h1")?.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (savedRoutineId) successRef.current?.focus();
  }, [savedRoutineId]);

  const handleConfirmSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const routineId = await onSave({
        name: routineName.trim() || "My Skincare Routine",
        description: routineDescription.trim(),
        skinTypeTags,
      });
      setSavedRoutineId(routineId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't save your routine. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="fixed m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-lg border-0 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50"
      onCancel={(event) => { event.preventDefault(); if (!isSaving) onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          event.currentTarget.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => { if (event.target === event.currentTarget && !isSaving && !savedRoutineId) onClose(); }}
    >
      <div className="relative p-5 sm:p-6">
        <button
          type="button"
          aria-label="Close save routine dialog"
          disabled={isSaving}
          onClick={onClose}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[#0e4a84] disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
        {savedRoutineId ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle className="mb-4 size-12 text-emerald-700" aria-hidden="true" />
            <h2 id={`${id}-title`} ref={successRef} tabIndex={-1} className="mb-2 text-xl font-semibold">Routine saved</h2>
            <p id={`${id}-description`} className="mb-5 text-sm text-zinc-600">Your routine is saved to your profile and ready to share.</p>
            <Button asChild variant="secondary" className="min-h-11 w-full">
              <Link href={`/routine/${savedRoutineId}`}>View routine</Link>
            </Button>
            <p className="mb-3 mt-5 text-sm text-zinc-600">Share your routine</p>
            <RoutineShareLink routineId={String(savedRoutineId)} />
            <Button variant="outline" className="mt-4 min-h-11 w-full" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleConfirmSave} aria-busy={isSaving}>
            <h2 id={`${id}-title`} className="mb-2 pr-8 text-xl font-semibold">Save routine</h2>
            <p id={`${id}-description`} className="mb-5 text-sm text-zinc-600">Saved routines are public and can be shared by link.</p>
            <label htmlFor={`${id}-name`} className="mb-2 block text-sm font-semibold">Routine name</label>
            <input
              id={`${id}-name`}
              type="text"
              autoFocus
              placeholder="My Skincare Routine"
              value={routineName}
              onChange={(event) => setRoutineName(event.target.value)}
              className="mb-5 min-h-11 w-full rounded-md border border-zinc-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#0e4a84]"
              disabled={isSaving}
            />
            <label htmlFor={`${id}-description-field`} className="mb-2 block text-sm font-semibold">Description <span className="font-normal text-zinc-600">(optional)</span></label>
            <textarea
              id={`${id}-description-field`}
              placeholder="Describe your routine"
              value={routineDescription}
              rows={3}
              onChange={(event) => setRoutineDescription(event.target.value)}
              className="mb-5 w-full rounded-md border border-zinc-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-[#0e4a84]"
              disabled={isSaving}
            />
            {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={isSaving}>Cancel</Button>
              <Button type="submit" variant="secondary" className="min-h-11" disabled={isSaving}>{isSaving ? "Saving…" : "Save routine"}</Button>
            </div>
            {isSaving && <p role="status" className="sr-only">Saving your routine…</p>}
          </form>
        )}
      </div>
    </dialog>
  );
}

function SaveRoutineModal({ isOpen, onClose, skinTypeTags, onSave }: SaveRoutineModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!isOpen || !mounted) return null;
  return createPortal(<SaveRoutineModalBody onClose={onClose} skinTypeTags={skinTypeTags} onSave={onSave} />, document.body);
}

export default memo(SaveRoutineModal);
