"use client";
import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Plus, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProceduralWave from "@/components/themes/ProceduralWave";
import ProductImage from "@/components/ui/ProductImage";
import { authClient } from "@/lib/auth-client";
import { useBuilderRoutine } from "@/hooks/useBuilderRoutine";
import { useBuilderProductNotes } from "@/hooks/useBuilderProductNotes";
import { useBuilderSkinTypeTags } from "@/hooks/useBuilderSkinTypeTags";
import {
  assertRoutineSaveItemsValid,
  buildRoutineSaveItems,
} from "@/lib/buildRoutineSaveItems";
import type { SkinType } from "@/types/product";
import RoutineSkinTypeTagPicker from "@/components/routine/RoutineSkinTypeTagPicker";
import BuilderSkeleton from "@/components/routine/BuilderSkeleton";
import BuilderProductNotesSection from "@/components/routine/BuilderProductNotesSection";
import SaveRoutineModal from "@/components/routine/SaveRoutineModal";
import { createRoutine } from "@/lib/routines";
import type { ProductCategory } from "@/types/product";

function AddCategoryProductLink({
  categoryId,
  label,
  className = "",
}: {
  categoryId: ProductCategory;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={`/products/category/${categoryId}`}
      className={`inline-flex min-h-11 items-center gap-1.5 pl-16 md:pl-20 text-sm text-zinc-600 hover:text-zinc-800 transition-colors ${className}`}
    >
      <Plus size={14} strokeWidth={2.5} aria-hidden />
      <span className="font-medium">Select {label.toLowerCase()}</span>
    </Link>
  );
}

export default function Builder() {
  const {
    routine,
    isLoaded: routineLoaded,
    persistence: routinePersistence,
    removeProductFromSlot,
    clearRoutine,
  } = useBuilderRoutine();
  const {
    entries: noteEntries,
    isLoaded: notesLoaded,
    persistence: notesPersistence,
    morningNotes,
    eveningNotes,
    addProductNote,
    updateProductNote,
    removeProductNote,
    removeNotesForProduct,
    clearProductNotes,
  } = useBuilderProductNotes();

  const routineProductOptions = useMemo(
    () =>
      routine.flatMap((slot) =>
        slot.products.map((product) => ({
          product,
          category: slot.id,
        })),
      ),
    [routine],
  );

  const modalProducts = useMemo(() => {
    const seen = new Set<number>();
    return routineProductOptions
      .filter(({ product }) => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      })
      .map(({ product, category }) => ({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        category,
      }));
  }, [routineProductOptions]);

  const saveItems = useMemo(
    () => buildRoutineSaveItems(routine, noteEntries),
    [routine, noteEntries],
  );

  const handleAddProductNote = useCallback(
    (
      productId: number,
      category: (typeof routineProductOptions)[0]["category"],
      timeOfDay: "AM" | "PM",
      userNote: string,
    ) => {
      const match = routineProductOptions.find(
        (o) => o.product.id === productId,
      );
      if (!match) return;
      addProductNote(match.product, category, timeOfDay, userNote);
    },
    [routineProductOptions, addProductNote],
  );

  const handleRemoveProduct = useCallback(
    (category: (typeof routine)[0]["id"], productId: number) => {
      removeProductFromSlot(category, productId);
      removeNotesForProduct(productId);
    },
    [removeProductFromSlot, removeNotesForProduct],
  );

  const { tags: skinTypeTags, setTags: setSkinTypeTags, isLoaded: tagsLoaded, persistence: tagsPersistence } = useBuilderSkinTypeTags();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [saveFeedback, setSaveFeedback] = useState<{ message: string; needsLogin?: boolean } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, startSaveTransition] = useTransition(); // lowers priority update so UI is responsive (laggy since so much is being pushed.)

  const handleCloseSaveModal = useCallback(() => setIsModalOpen(false), []);

  const handleSaveRoutine = useCallback(
    async ({
      name,
      description,
      skinTypeTags: tags,
    }: {
      name: string;
      description: string;
      skinTypeTags: SkinType[];
    }) => {
      const items = buildRoutineSaveItems(routine, noteEntries);
      assertRoutineSaveItemsValid(items);
      const response = await createRoutine({
        name,
        description,
        skinTypeTags: tags,
        items,
      });
      clearRoutine();
      clearProductNotes();
      setSkinTypeTags([]);
      return response.id;
    },
    [routine, noteEntries, clearRoutine, clearProductNotes, setSkinTypeTags],
  );

  const toggleSkinTypeTag = (tag: SkinType) => {
    setSkinTypeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleInitialSave = () => {
    setSaveFeedback(null);
    try {
      assertRoutineSaveItemsValid(saveItems);
    } catch (e) {
      setSaveFeedback({ message: e instanceof Error ? e.message : "Add a product before saving your routine." });
      return;
    }
    if (!session) {
      setSaveFeedback({ message: "Log in to save your routine to your profile.", needsLogin: true });
      return;
    }
    startSaveTransition(() => setIsModalOpen(true));
  };

  const totalPrice = routine.reduce(
    (acc, step) =>
      acc + step.products.reduce((s, p) => s + (p.price ?? 0), 0),
    0,
  );
  const hasPricedProduct = routine.some((step) =>
    step.products.some((product) => product.price != null),
  );
  const totalItems = routine.reduce(
    (acc, step) => acc + step.products.length,
    0,
  );

  // Don't render until hooks are loaded
  if (!routineLoaded || !notesLoaded || !tagsLoaded) {
    return <BuilderSkeleton />;
  }

  return (
    <div className="relative mt-18 min-h-screen w-full bg-[#F8F8F8]">
      <ProceduralWave 
        seed={3}
        height={190} 
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <div className="relative z-1 max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 tabIndex={-1} className="text-2xl md:text-4xl font-extrabold text-[#2E2E2E]">
              Build your routine
            </h1>
            <p className="mt-2 text-sm text-zinc-600">Choose the products you use. You can skip categories.</p>
          </div>
          <p role="status" className="text-sm text-zinc-600">
            {[routinePersistence, notesPersistence, tagsPersistence].includes("error")
              ? "Draft couldn't be saved on this device. Keep this page open."
              : [routinePersistence, notesPersistence, tagsPersistence].includes("pending")
                ? "Saving draft…"
                : "Draft saved on this device"}
          </p>

          {/* External Link; removed */}
          {/* <div className="flex items-center bg-white border border-zinc-200 rounded-md overflow-hidden shadow-sm max-w-lg w-full md:w-auto">
            <div className="bg-zinc-50 px-3 py-2 border-r border-zinc-200 text-zinc-400">
              <ExternalLink size={16} />
            </div>
            <input
              readOnly
              value={typeof window !== "undefined" ? window.location.href : ""}
              className="px-3 py-2 text-sm text-zinc-600 outline-none w-full md:w-64 bg-transparent"
            />
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="px-4 py-2 hover:bg-zinc-50 border-l border-zinc-200 transition-colors"
            >
              <Copy size={16} className="text-zinc-500 hover:text-black" />
            </button>
          </div> */}
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 text-zinc-600 font-semibold text-sm border-b border-zinc-200 px-2 pb-2 mb-2">
          <div className="col-span-2">Category</div>
          <div className="col-span-7">Product selection</div>
          <div className="col-span-1 text-center">Seller</div>
          <div className="col-span-2 text-right">Price</div>
        </div>

        {/* Builder */}
        <div className="space-y-4 md:space-y-0">
          {routine.map((step) => (
            <div
              key={step.id}
              className={`
              group bg-white rounded-xl border border-zinc-200 shadow-sm p-4 grid grid-cols-1 gap-4 transition-all hover:bg-zinc-50/50
              md:bg-transparent md:rounded-none md:border-0 md:border-b md:border-zinc-200 md:shadow-none md:px-2 md:py-5 md:grid-cols-12 md:gap-y-4 md:items-center
              `}
            >
              {/* Category Label */}
              <div
                className="col-span-1 md:col-span-2 flex justify-between md:block md:self-start"
                style={
                  step.products.length > 0
                    ? { gridRow: `span ${step.products.length}` }
                    : undefined
                }
              >
                <Link href={`/products/category/${step.id}`}>
                  <span className="font-semibold text-zinc-900 text-sm hover:text-zinc-600 transition-colors">
                    {step.label === "Eye Care" ? "Eye care" : step.label}
                  </span>
                </Link>
                {/* Mobile Price Display */}
                {step.products.length > 0 && (
                  <span className="md:hidden font-bold text-zinc-900">
                    {step.products.some((product) => product.price != null)
                      ? `$${step.products
                          .reduce((s, p) => s + (p.price ?? 0), 0)
                          .toFixed(2)}`
                      : "-"}
                  </span>
                )}
              </div>

              {step.products.length > 0 ? (
                <>
                  {step.products.map((prod, productIndex) => (
                    <div
                      key={`${step.id}-${prod.id}-${productIndex}`}
                      className="col-span-1 md:contents"
                    >
                      <div className="flex items-center gap-4 md:col-span-7 md:col-start-3">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-100 rounded-md border border-zinc-200 shrink-0 overflow-hidden">
                          {prod.imageUrls && prod.imageUrls[0] ? (
                            <ProductImage
                              src={prod.imageUrls[0]}
                              alt={prod.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-200" />
                          )}
                        </div>

                        <div className="grow min-w-0">
                          <Link
                            href={`/product/id/${prod.id}`}
                            aria-label={`${prod.brand} ${prod.name}`}
                            className="block text-sm leading-5 hover:underline hover:text-blue-800 transition-colors"
                          >
                            <span className="font-medium text-zinc-600">{prod.brand}</span>
                            <span aria-hidden="true" className="mx-1 mb-[0.12em] inline-block size-0.5 shrink-0 rounded-full bg-zinc-500 align-middle" />
                            <span className="font-semibold text-zinc-900">{prod.name}</span>
                          </Link>
                          <div className="md:hidden text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            via {prod.merchant || "Unknown"}{" "}
                            <ExternalLink size={10} />
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            type="button"
                            aria-label={`Remove ${prod.brand} ${prod.name}`}
                            onClick={() =>
                              handleRemoveProduct(step.id, prod.id)
                            }
                            className="flex size-11 items-center justify-center rounded-md text-zinc-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="hidden md:flex md:col-span-1 items-center justify-center">
                        <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded text-xs font-bold text-zinc-700 shadow-sm">
                          {prod.merchantLogo &&
                          prod.merchantLogo.startsWith("http") ? (
                            <ProductImage
                              src={prod.merchantLogo}
                              alt={prod.merchant || "Merchant"}
                              width={20}
                              height={20}
                              className="object-cover rounded-sm"
                              sizes="20px"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] text-blue-700">
                              ?
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-2 text-right text-lg font-bold text-zinc-900">
                        {prod.price == null ? "-" : `$${prod.price.toFixed(2)}`}
                      </div>
                    </div>
                  ))}

                  <div className="col-span-1 md:col-span-7 md:col-start-3">
                    <AddCategoryProductLink
                      categoryId={step.id}
                      label={step.label}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-1 md:col-span-7">
                    <Link href={`/products/category/${step.id}`}>
                      <div className="w-full h-14 md:h-16 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center gap-2 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 transition-all cursor-pointer">
                        <Plus size={18} />
                        <span className="font-medium text-sm">
                          Select {step.label.toLowerCase()}
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="hidden md:block md:col-span-1" />
                  <div className="hidden md:block md:col-span-2 text-right" />
                </>
              )}
            </div>
          ))}
        </div>
        <BuilderProductNotesSection
          modalProducts={modalProducts}
          morningNotes={morningNotes}
          eveningNotes={eveningNotes}
          onAddNote={handleAddProductNote}
          onUpdateNote={updateProductNote}
          onRemoveNote={removeProductNote}
        />
        <div
          className={`
          w-full bg-white border border-zinc-200 shadow-md rounded-lg mt-8 px-4 sm:px-6 py-4
          lg:shadow-sm
          `}
        >
          <div className="mb-4">
            <div className="mb-2 text-sm font-semibold text-zinc-600">
              Skin types
            </div>
            <RoutineSkinTypeTagPicker
              value={skinTypeTags}
              onToggle={toggleSkinTypeTag}
            />
          </div>
          {!sessionPending && !session && (
            <p id="builder-save-auth" className="mb-4 text-sm text-zinc-600">
              Log in or create an account to save your routine to your profile.
            </p>
          )}
          <div className="max-w-6xl mx-auto flex flex-wrap gap-4 justify-between items-center">
            <div>
              <div className="text-sm font-semibold text-zinc-600">
                Estimated total
              </div>
              <div className="text-2xl font-extrabold text-black">
                {hasPricedProduct ? `CA $${totalPrice.toFixed(2)}` : "-"}
              </div>
            </div>
            <div className="flex gap-3">
              <span className="hidden sm:flex items-center text-sm font-medium text-zinc-500 mr-2">
                {totalItems} items selected
              </span>
              {!sessionPending && !session ? (
                <Button asChild variant="secondary" className="min-h-11">
                  <Link href="/login" aria-describedby="builder-save-auth">Log in to save</Link>
                </Button>
              ) : (
              <Button
                variant="secondary"
                onClick={handleInitialSave}
                disabled={totalItems === 0 || sessionPending}
                className="min-h-11"
              >
                {sessionPending ? "Checking account…" : "Save routine"}
              </Button>
              )}
              {isModalOpen && (
                <SaveRoutineModal
                  isOpen
                  onClose={handleCloseSaveModal}
                  skinTypeTags={skinTypeTags}
                  onSave={handleSaveRoutine}
                />
              )}
            </div>
          </div>
          {totalItems === 0 && <p className="mt-3 text-sm text-zinc-600">Add a product to your routine before saving.</p>}
          {saveFeedback && (
            <div role="alert" className="mt-3 text-sm text-zinc-700">
              <p>{saveFeedback.message}</p>
              {saveFeedback.needsLogin && <Link href="/login" className="mt-1 inline-flex min-h-11 items-center font-semibold text-[#0e4a84] underline">Log in</Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
