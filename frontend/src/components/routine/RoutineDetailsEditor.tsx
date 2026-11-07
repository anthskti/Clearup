"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateRoutineById } from "@/lib/routines";

interface RoutineDetailsEditorProps {
  routineId: number;
  canEdit: boolean;
  initialDescription?: string;
}

export default function RoutineDetailsEditor({ routineId, canEdit, initialDescription }: RoutineDetailsEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hasDescription = Boolean(initialDescription?.trim());

  async function save() {
    setSaving(true);
    setError("");
    try {
      await updateRoutineById(routineId, { description });
      setOpen(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Couldn't save the description.");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={hasDescription ? "Edit description" : "Add description"}
          onClick={() => { setDescription(initialDescription ?? ""); setError(""); }}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-[#0e4a84] hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84]"
        >
          <Pencil size={14} aria-hidden="true" />
          {hasDescription ? "Edit" : "Add"}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold text-zinc-900">{hasDescription ? "Edit description" : "Add description"}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-zinc-500">
            Tell people what this routine is for and share your experience.
          </Dialog.Description>
          <label htmlFor="routine-description" className="mb-2 mt-5 block text-sm font-medium text-zinc-700">Description</label>
          <textarea
            id="routine-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            className="w-full rounded-lg border border-zinc-300 p-3 text-base outline-none focus:border-[#0e4a84] focus:ring-2 focus:ring-[#0e4a84]/20"
          />
          {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild><Button variant="outline" className="min-h-11 bg-white">Cancel</Button></Dialog.Close>
            <Button variant="secondary" className="min-h-11" onClick={save} disabled={saving || description === (initialDescription ?? "")}>
              {saving ? "Saving…" : "Save description"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
