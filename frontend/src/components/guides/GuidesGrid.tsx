import Link from "next/link";
import type { GuideRoutine } from "@/types/routine";
import RoutinePreviewCard from "./RoutinePreviewCard";

export default function GuidesGrid({ items, filtered = false }: { items: GuideRoutine[]; filtered?: boolean }) {
  if (!items.length) {
    return (
      <div
        className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center text-sm text-zinc-500"
      >
        <p>{filtered ? "No routines match these filters." : "No community routines yet."}</p>
        <Link
          href={filtered ? "/routines" : "/builder"}
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#0e4a84] hover:underline"
        >{filtered ? "Clear filters" : "Build a routine"}</Link>
      </div>
    );
  }

  return (
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
      {items.map((routine) => (
        <RoutinePreviewCard
          key={routine.routineId}
          routineId={routine.routineId}
          name={routine.name}
          authorLabel={routine.author?.name?.trim()}
          skinTypeTags={routine.skinTypeTags}
          previewImageUrls={routine.previewImageUrls}
          estimatedTotalPrice={routine.estimatedTotalPrice}
        />
      ))}
    </div>
  );
}
