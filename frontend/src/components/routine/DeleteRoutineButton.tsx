"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DeleteRoutineModal from "@/components/routine/DeleteRoutineModal";
import { Ellipsis, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";

interface Props {
  routineId: number;
}

export default function DeleteRoutineButton({ routineId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="shrink-0">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="outline" size="icon" className="size-11 border-zinc-200 bg-white text-zinc-600 shadow-sm hover:bg-zinc-50" aria-label="Routine actions">
            <Ellipsis size={18} aria-hidden="true" />
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-44 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
            <DropdownMenu.Item
              onSelect={() => setIsModalOpen(true)}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium text-red-700 outline-none data-[highlighted]:bg-red-50"
            >
              <Trash2 size={16} aria-hidden="true" /> Delete routine
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DeleteRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        routineId={routineId}
        onSuccess={() => {
          router.refresh();
          router.push("/profile/created-routines");
        }}
      />
    </div>
  );
}
