"use client";

import { memo, useId, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutineNoteDisplay } from "@/types/builder";
import type { ProductCategory } from "@/types/product";
import type { TimeOfDay } from "@/types/routine";
import AddProductNoteModal, {
  type ModalProductOption,
} from "./AddProductNoteModal";
import RoutineNoteItemHeader from "./RoutineNoteItemHeader";

interface BuilderProductNotesSectionProps {
  modalProducts: ModalProductOption[];
  morningNotes: RoutineNoteDisplay[];
  eveningNotes: RoutineNoteDisplay[];
  onAddNote: (
    productId: number,
    category: ProductCategory,
    timeOfDay: TimeOfDay,
    userNote: string,
  ) => void;
  onUpdateNote: (productId: number, timeOfDay: TimeOfDay, userNote: string) => void;
  onRemoveNote: (productId: number, timeOfDay: TimeOfDay) => void;
}

const NoteColumn = memo(function NoteColumn({
  title,
  accentClass,
  dotClass,
  timeOfDay,
  notes,
  hasProducts,
  availableCount,
  onAddClick,
  onUpdateNote,
  onRemoveNote,
}: {
  title: string;
  accentClass: string;
  dotClass: string;
  timeOfDay: TimeOfDay;
  notes: RoutineNoteDisplay[];
  hasProducts: boolean;
  availableCount: number;
  onAddClick: () => void;
  onUpdateNote: (productId: number, timeOfDay: TimeOfDay, userNote: string) => void;
  onRemoveNote: (productId: number, timeOfDay: TimeOfDay) => void;
}) {
  const id = useId();
  const unavailable = !hasProducts
    ? "Select products above to add notes."
    : availableCount === 0
      ? `All selected products have ${title.toLowerCase()} notes.`
      : null;
  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 id={`${id}-title`} tabIndex={-1} className={`flex items-center gap-2 text-base font-semibold ${accentClass}`}>
          <span aria-hidden="true" className={`size-2 rounded-full ${dotClass}`} />
          {title}
        </h3>
        <Button
          type="button"
          variant="outline"
          onClick={onAddClick}
          disabled={availableCount === 0}
          aria-label={`Add ${title.toLowerCase()} note`}
          aria-describedby={unavailable ? `${id}-availability` : undefined}
          className="min-h-11 border-zinc-300 px-3 text-sm text-[#0E4B84]! hover:bg-zinc-50"
        >
          <Plus size={16} aria-hidden="true" /> Add note
        </Button>
      </div>
      {unavailable && <p id={`${id}-availability`} className="mb-3 text-sm text-zinc-600">{unavailable}</p>}
      {notes.length === 0 && hasProducts && <p className="text-sm text-zinc-600">No {title.toLowerCase()} notes yet.</p>}
      {notes.length > 0 && <ol className="space-y-1">
        {notes.map((note) => (
          <li key={`${note.productId}-${timeOfDay}`} className="border-t border-zinc-200 pt-2">
            <RoutineNoteItemHeader
              stepOrder={note.stepOrder}
              productName={note.productName}
              productBrand={note.productBrand}
              category={note.category}
              variant="builder"
            />
            <textarea
              aria-label={`${title} notes for ${note.productName}`}
              value={note.userNote}
              onChange={(e) =>
                onUpdateNote(note.productId, timeOfDay, e.target.value)
              }
              className="w-full resize-y rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-700 outline-none focus:ring-2 focus:ring-[#0E4B84] md:text-sm"
              placeholder="e.g. Apply two drops after toner."
              rows={2}
            />
            <button
              type="button"
              onClick={() => onRemoveNote(note.productId, timeOfDay)}
              aria-label={`Remove ${note.productName} from ${title.toLowerCase()} notes`}
              className="mt-1 inline-flex min-h-11 items-start pt-1 text-sm text-red-700 hover:text-red-800"
            >
              Remove note
            </button>
          </li>
        ))}
      </ol>}
    </section>
  );
});

function BuilderProductNotesSection({
  modalProducts,
  morningNotes,
  eveningNotes,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
}: BuilderProductNotesSectionProps) {
  const [modalTimeOfDay, setModalTimeOfDay] = useState<TimeOfDay | null>(null);

  const amExcluded = useMemo(
    () => morningNotes.map((n) => n.productId),
    [morningNotes],
  );
  const pmExcluded = useMemo(
    () => eveningNotes.map((n) => n.productId),
    [eveningNotes],
  );

  return (
    <>
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-zinc-200 p-4 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-900 mb-2">
          Routine notes
        </h2>
        <p className="text-sm text-zinc-600 mb-2">
          Optional: describe how you use your products.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          <NoteColumn
            title="Morning"
            accentClass="text-amber-700"
            dotClass="bg-amber-500"
            timeOfDay="AM"
            notes={morningNotes}
            hasProducts={modalProducts.length > 0}
            availableCount={modalProducts.filter((product) => !amExcluded.includes(product.productId)).length}
            onAddClick={() => setModalTimeOfDay("AM")}
            onUpdateNote={onUpdateNote}
            onRemoveNote={onRemoveNote}
          />
          <NoteColumn
            title="Night"
            accentClass="text-violet-700"
            dotClass="bg-violet-500"
            timeOfDay="PM"
            notes={eveningNotes}
            hasProducts={modalProducts.length > 0}
            availableCount={modalProducts.filter((product) => !pmExcluded.includes(product.productId)).length}
            onAddClick={() => setModalTimeOfDay("PM")}
            onUpdateNote={onUpdateNote}
            onRemoveNote={onRemoveNote}
          />
        </div>
      </div>

      <AddProductNoteModal
        isOpen={modalTimeOfDay !== null}
        onClose={() => setModalTimeOfDay(null)}
        timeOfDay={modalTimeOfDay ?? "AM"}
        products={modalProducts}
        excludedProductIds={
          modalTimeOfDay === "PM" ? pmExcluded : amExcluded
        }
        onConfirm={(productId, category, userNote) => {
          if (modalTimeOfDay) {
            onAddNote(productId, category, modalTimeOfDay, userNote);
          }
        }}
      />
    </>
  );
}

export default memo(BuilderProductNotesSection);
