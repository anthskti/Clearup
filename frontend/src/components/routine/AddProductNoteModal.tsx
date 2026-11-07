// Modal for adding a product note to a routine
"use client";

import { memo, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProductCategory } from "@/types/product";
import type { TimeOfDay } from "@/types/routine";

const emptySubscribe = () => () => {};

// Lean list for the picker — avoids passing full Product blobs into the modal.
export type ModalProductOption = {
  productId: number;
  name: string;
  brand: string;
  category: ProductCategory;
};

interface AddProductNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeOfDay: TimeOfDay;
  products: ModalProductOption[];
  excludedProductIds: number[];
  onConfirm: (
    productId: number,
    category: ProductCategory,
    userNote: string,
  ) => void;
}

function AddProductNoteModalBody({
  onClose,
  timeOfDay,
  products,
  excludedProductIds,
  onConfirm,
}: Omit<AddProductNoteModalProps, "isOpen">) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [userNote, setUserNote] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        if (!previousFocus.matches(":disabled")) previousFocus.focus();
        else previousFocus.closest("section")?.querySelector<HTMLElement>("h3")?.focus();
      }
    };
  }, []);

  const excluded = useMemo(
    () => new Set(excludedProductIds),
    [excludedProductIds],
  );

  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return products.filter((p) => {
      const key = `${p.category}-${p.productId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [products]);

  const available = useMemo(
    () => uniqueProducts.filter((p) => !excluded.has(p.productId)),
    [uniqueProducts, excluded],
  );

  const selected = available.find((p) => p.productId === selectedId);
  const label = timeOfDay === "AM" ? "morning" : "night";

  const handleConfirm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    onConfirm(selected.productId, selected.category, userNote);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      className="fixed m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-lg border-0 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Only the checked (or first) radio is a Tab stop within its group.
        const radios = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
        const radioStop = radios.find((radio) => radio.checked) ?? radios[0];
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled)',
        )).filter((element) => element.getClientRects().length > 0 &&
          (!(element instanceof HTMLInputElement) || element.type !== "radio" || element === radioStop));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <form onSubmit={handleConfirm} className="relative p-5 sm:p-6">
        <button
          type="button"
          aria-label={`Close add ${label} note dialog`}
          onClick={onClose}
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-[#0E4B84]"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id={`${id}-title`} className="mb-2 pr-8 text-xl font-semibold">Add {label} note</h2>
        <p id={`${id}-description`} className="mb-5 text-sm text-zinc-600">
          Choose a product already in your routine.
        </p>

        {available.length === 0 ? (
          <p className="text-sm text-zinc-600 mb-4">
            {products.length === 0
              ? "Add products to your routine first, then attach notes here."
              : "Every product in your routine already has a note for this time."}
          </p>
        ) : (
          <fieldset className="mb-5 min-w-0">
            <legend className="mb-2 text-sm font-semibold">Product</legend>
            <div className="max-h-48 overflow-y-auto rounded-md border border-zinc-300 divide-y divide-zinc-200">
            {available.map((product) => (
              <label
                key={`${product.category}-${product.productId}`}
                className={`flex min-h-11 cursor-pointer items-start gap-3 px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#0E4B84] hover:bg-[#e9f6ff]/50 ${
                  selectedId === product.productId
                    ? "bg-[#e9f6ff]"
                    : ""
                }`}
              >
                <span className="relative mt-0.5 size-5 shrink-0">
                <input
                  type="radio"
                  name={`${id}-product`}
                  value={product.productId}
                  checked={selectedId === product.productId}
                  onChange={() => setSelectedId(product.productId)}
                  aria-label={`${product.brand} ${product.name}`}
                  className="size-5 cursor-pointer appearance-none rounded-full border border-zinc-400 bg-white outline-none checked:border-[#0E4B84] checked:bg-[#0E4B84]"
                />
                  {selectedId === product.productId && <Check size={14} aria-hidden="true" className="pointer-events-none absolute left-0.5 top-0.5 text-white" />}
                </span>
                <div className="min-w-0">
                  <div className="text-sm leading-5">
                    <span className="font-medium text-zinc-600">{product.brand}</span>
                    <span aria-hidden="true" className="mx-1 mb-[0.12em] inline-block size-0.5 rounded-full bg-zinc-500 align-middle" />
                    <span className="font-semibold text-zinc-900">{product.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-600">{product.category === "eyecare" ? "Eye care" : product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                </div>
              </label>
            ))}
            </div>
          </fieldset>
        )}

        <label htmlFor={`${id}-note`} className="mb-2 block text-sm font-semibold">Usage note <span className="font-normal text-zinc-600">(optional)</span></label>
        <textarea
          id={`${id}-note`}
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          placeholder="e.g. Apply two drops after toner."
          rows={3}
          disabled={!selected}
          className="mb-5 w-full resize-y rounded-md border border-zinc-300 p-2 text-base text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#0E4B84] disabled:bg-zinc-50 disabled:opacity-50 md:text-sm"
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" className="min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            type="submit"
            className="min-h-11"
            disabled={!selected}
          >
            Add note
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function AddProductNoteModal({
  isOpen,
  onClose,
  timeOfDay,
  products,
  excludedProductIds,
  onConfirm,
}: AddProductNoteModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AddProductNoteModalBody
      key={timeOfDay}
      onClose={onClose}
      timeOfDay={timeOfDay}
      products={products}
      excludedProductIds={excludedProductIds}
      onConfirm={onConfirm}
    />,
    document.body,
  );
}

export default memo(AddProductNoteModal);
