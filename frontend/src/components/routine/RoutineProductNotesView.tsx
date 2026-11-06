import { hydrateProductNotesFromApi } from "@/lib/buildRoutineSaveItems";
import type { RoutineNoteDisplay } from "@/types/builder";
import type { RoutineProductWithDetails, TimeOfDay } from "@/types/routine";
import RoutineNoteItemHeader from "./RoutineNoteItemHeader";

function sortNotes(notes: RoutineNoteDisplay[], timeOfDay: TimeOfDay) {
  return notes
    .filter((n) => n.timeOfDay === timeOfDay)
    .sort((a, b) => a.stepOrder - b.stepOrder);
}

function NoteColumn({
  title,
  accentClass,
  dotClass,
  notes,
}: {
  title: string;
  accentClass: string;
  dotClass: string;
  notes: RoutineNoteDisplay[];
}) {
  return (
    <div>
      <h3
        className={`flex items-center gap-2 mb-4 ${accentClass} font-semibold text-base`}
      >
        <span aria-hidden="true" className={`size-2 rounded-full ${dotClass}`} />
        {title}
      </h3>
      {notes.length === 0 && <p className="text-sm text-zinc-600">No {title.toLowerCase()} notes yet.</p>}
      <ol className="space-y-1">
        {notes.map((note) => (
          <li key={`${note.productId}-${note.timeOfDay}`} className="border-t border-zinc-200 pt-2">
            <RoutineNoteItemHeader
              variant="builder"
              stepOrder={note.stepOrder}
              productName={note.productName}
              productBrand={note.productBrand}
              category={note.category}
            />
            {note.userNote.trim() ? (
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap break-words mb-3">
                {note.userNote}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

interface RoutineProductNotesViewProps {
  products: RoutineProductWithDetails[];
}

export default function RoutineProductNotesView({
  products,
}: RoutineProductNotesViewProps) {
  const displayNotes = hydrateProductNotesFromApi(products);
  const amNotes = sortNotes(displayNotes, "AM");
  const pmNotes = sortNotes(displayNotes, "PM");

  if (amNotes.length === 0 && pmNotes.length === 0) return <p className="mt-4 text-sm text-zinc-500">The author hasn’t added usage notes yet.</p>;

  return (
    <div className="mt-4 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6">
      <div className="grid md:grid-cols-2 gap-8">
        <NoteColumn
          title="Morning"
          accentClass="text-amber-700"
          dotClass="bg-amber-500"
          notes={amNotes}
        />
        <NoteColumn
          title="Night"
          accentClass="text-violet-700"
          dotClass="bg-violet-500"
          notes={pmNotes}
        />
      </div>
    </div>
  );
}
