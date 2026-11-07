"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoutineProductWithDetails } from "@/types/routine";
import RoutineProductNotesView from "./RoutineProductNotesView";
import RoutineProductsNotesEditor from "./RoutineProductsNotesEditor";

export default function RoutineUsageSection({ routineId, canEdit, products }: {
  routineId: number;
  canEdit: boolean;
  products: RoutineProductWithDetails[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="mt-10" aria-labelledby="routine-usage-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="routine-usage-title" className="text-lg font-semibold text-zinc-900">Routine notes</h2>
        {canEdit && <Button variant="outline" className="min-h-11 bg-white" onClick={() => setEditing(!editing)}>{editing ? "Cancel editing" : "Edit notes"}</Button>}
      </div>
      {editing ? (
        <RoutineProductsNotesEditor routineId={routineId} canEdit initialProducts={products} onSaved={() => setEditing(false)} />
      ) : <RoutineProductNotesView products={products} />}
    </section>
  );
}
