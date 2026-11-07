"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeFilterCount: number;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
}

export default function ProductFiltersSheet({
  open,
  onOpenChange,
  activeFilterCount,
  onClear,
  onApply,
  children,
}: ProductFiltersSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-150 motion-reduce:animate-none" />
        <DialogPrimitive.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl animate-in slide-in-from-bottom duration-200 motion-reduce:animate-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:slide-in-from-bottom-0">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold text-zinc-900">
                Filters
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-zinc-500">
                Choose what matters to you.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Close filters"
              >
                <X aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="overflow-y-auto overscroll-contain px-5 py-5">
            {children}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-zinc-200 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              onClick={onClear}
              disabled={activeFilterCount === 0}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 flex-1"
              onClick={onApply}
            >
              Show results
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
