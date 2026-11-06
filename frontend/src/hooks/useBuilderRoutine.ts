import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { Product, ProductCategory, type CatalogError } from "@/types/product";
import { pickLowestPriceOffer } from "@/lib/products";
import {
  getCachedCatalogMerchantOffers,
  getCatalogMerchantOffersByProductIds,
} from "@/lib/catalogMerchantOffers";
import {
  expandStoredRoutine,
  normalizeStoredSlots,
  slimRoutineForStorage,
} from "@/lib/slimBuilderRoutineStorage";

const emptySubscribe = () => () => {};

export interface RoutineSlot {
  id: ProductCategory;
  label: string;
  products: Array<
    Omit<Product, "price"> & {
      price: number | null;
      merchant?: string;
      merchantLogo?: string;
      merchantLink?: string;
    }
  >;
}

const CORE_ROUTINE_SLOTS: RoutineSlot[] = [
  { id: "cleanser", label: "Cleanser", products: [] },
  { id: "toner", label: "Toner", products: [] },
  { id: "essence", label: "Essence", products: [] },
  { id: "serum", label: "Serum", products: [] },
  { id: "eyecare", label: "Eye Care", products: [] },
  { id: "moisturizer", label: "Moisturizer", products: [] },
  { id: "sunscreen", label: "Sunscreen", products: [] },
];

const OTHER_SLOT: RoutineSlot = {
  id: "other",
  label: "Other",
  products: [],
};

const STORAGE_KEY = "builder-routine";

function createEmptyRoutine(): RoutineSlot[] {
  return CORE_ROUTINE_SLOTS.map((slot) => ({ ...slot, products: [] }));
}

function ensureSlotExists(
  slots: RoutineSlot[],
  category: ProductCategory,
): RoutineSlot[] {
  if (slots.some((slot) => slot.id === category)) return slots;
  if (category === "other") {
    return [...slots, { ...OTHER_SLOT, products: [] }];
  }
  return slots;
}

function dropEmptyOtherSlot(slots: RoutineSlot[]): RoutineSlot[] {
  return slots.filter(
    (slot) => slot.id !== "other" || slot.products.length > 0,
  );
}

function mergeStoredRoutine(stored: RoutineSlot[]): RoutineSlot[] {
  const byId = new Map(stored.map((slot) => [slot.id, slot]));
  const merged: RoutineSlot[] = CORE_ROUTINE_SLOTS.map((slot) => ({
    ...slot,
    products: dedupeProductsById(byId.get(slot.id)?.products ?? []),
  }));
  const otherStored = byId.get("other");
  if (otherStored?.products.length) {
    merged.push({
      ...OTHER_SLOT,
      products: dedupeProductsById(otherStored.products),
    });
  }
  return merged;
}

// Deduplicate products by ID for hydration
function dedupeProductsById<T extends { id: number }>(products: T[]): T[] {
  const seen = new Set<number>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function readStoredRoutine(): RoutineSlot[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createEmptyRoutine();
    const parsed = JSON.parse(saved);
    const normalized = expandStoredRoutine(normalizeStoredSlots(parsed));
    return mergeStoredRoutine(normalized);
  } catch (e) {
    console.error("Failed to parse saved routine", e);
    return createEmptyRoutine();
  }
}

export const useBuilderRoutine = () => {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [routine, setRoutine] = useState<RoutineSlot[]>(createEmptyRoutine);
  const [isLoaded, setIsLoaded] = useState(false);
  const [offerFailures, setOfferFailures] = useState<Record<number, CatalogError>>({});
  const [isRetryingOffers, setIsRetryingOffers] = useState(false);
  const [offerRequestIds, setOfferRequestIds] = useState<number[]>([]);

  if (isClient && !isLoaded) {
    setRoutine(readStoredRoutine());
    setIsLoaded(true);
  }

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;
    const hasProducts = routine.some((slot) => slot.products.length > 0);
    try {
      if (!hasProducts) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(slimRoutineForStorage(routine)),
      );
    } catch (e) {
      console.error("Failed to persist builder routine", e);
    }
  }, [routine, isLoaded]);

  useEffect(() => {
    if (!offerRequestIds.length) return;
    const controller = new AbortController();

    void getCatalogMerchantOffersByProductIds(offerRequestIds, { signal: controller.signal }).then(({ offers, failedIds, error }) => {
      if (controller.signal.aborted) return;
      setRoutine((previous) => previous.map((slot) => ({
        ...slot,
        products: slot.products.map((product) => {
          // A failed response never replaces a previously loaded price.
          if (offers[product.id] === undefined) return product;
          const bestOffer = pickLowestPriceOffer(offers[product.id]);
          return {
            ...product,
            price: bestOffer?.price ?? null,
            merchant: bestOffer?.merchant?.name || "-",
            merchantLogo: bestOffer?.merchant?.logo || "-",
            merchantLink: bestOffer?.website,
          };
        }),
      })));
      setOfferFailures((previous) => {
        const next = { ...previous };
        for (const id of offerRequestIds) delete next[id];
        if (error) for (const id of failedIds) next[id] = error;
        return next;
      });
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Builder merchant offers failed", error);
      setOfferFailures((previous) => ({
        ...previous,
        ...Object.fromEntries(offerRequestIds.map((id) => [id, { status: null, requestId: null, retryAt: null }])),
      }));
    }).finally(() => {
      if (controller.signal.aborted) return;
      // Keep any newer additions queued while this request was completing.
      setOfferRequestIds((current) => current === offerRequestIds ? [] : current);
      setIsRetryingOffers(false);
    });

    return () => controller.abort();
  }, [offerRequestIds]);

  const addProductToSlot = useCallback(
    async (category: ProductCategory, product: Product) => {
      const cachedOffers = getCachedCatalogMerchantOffers(product.id);
      const bestOffer = cachedOffers ? pickLowestPriceOffer(cachedOffers) : null;
      // Add product to the array for the slot if not already present
      setRoutine((prev) => {
        const slots = ensureSlotExists(prev, category);
        return slots.map((slot) =>
          slot.id === category
            ? {
                ...slot,
                products: slot.products.some((p) => p.id === product.id)
                  ? slot.products
                  : [
                      ...slot.products,
                      {
                        ...product,
                        price: bestOffer?.price ?? null,
                        merchant: bestOffer?.merchant?.name || "-",
                        merchantLogo: bestOffer?.merchant?.logo || "-",
                        merchantLink: bestOffer?.website,
                      },
                    ],
              }
            : slot,
        );
      });

      // The effect batches additions and restarts cancelled work in Strict Mode.
      setOfferRequestIds((previous) => [...new Set([...previous, product.id])]);
    },
    [],
  );

  // If productId is provided, remove that single product from the slot;
  // otherwise clear all products from the slot.
  const removeProductFromSlot = useCallback(
    (category: ProductCategory, productId?: number | string) => {
      setRoutine((prev) =>
        dropEmptyOtherSlot(
          prev.map((slot) => {
            if (slot.id !== category) return slot;
            if (!productId) return { ...slot, products: [] };
            return {
              ...slot,
              products: slot.products.filter(
                (p) => String(p.id) !== String(productId),
              ),
            };
          }),
        ),
      );
    },
    [],
  );

  const clearRoutine = useCallback(() => {
    setOfferRequestIds([]);
    setOfferFailures({});
    setRoutine(createEmptyRoutine());
  }, []);

  const failedProductIds = [...new Set(routine.flatMap((slot) => slot.products.map((product) => product.id)))]
    .filter((id) => offerFailures[id]);
  const merchantOfferError = failedProductIds.reduce<CatalogError | null>((latest, id) => {
    const error = offerFailures[id];
    return !latest || (error.retryAt ?? 0) > (latest.retryAt ?? 0) ? error : latest;
  }, null);

  const retryMerchantOffers = () => {
    if (isRetryingOffers || !failedProductIds.length) return;
    setIsRetryingOffers(true);
    setOfferRequestIds((previous) => [...new Set([...previous, ...failedProductIds])]);
  };

  // Listen for products added from other pages
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    const handleAddToRoutine = (event: CustomEvent) => {
      const { product, category } = event.detail;
      addProductToSlot(category, product);
      localStorage.removeItem("pending-routine-add");
    };

    window.addEventListener(
      "addToRoutine",
      handleAddToRoutine as EventListener,
    );

    // Check for pending add in localStorage (from page navigation)
    const checkPendingAdd = () => {
      const pendingAdd = localStorage.getItem("pending-routine-add");
      if (pendingAdd) {
        try {
          const data = JSON.parse(pendingAdd);
          // Only process if it's recent (within last 30 seconds)
          if (Date.now() - data.timestamp < 30000) {
            addProductToSlot(data.category, data.product);
          }
          localStorage.removeItem("pending-routine-add");
        } catch (e) {
          console.error("Failed to parse pending routine add", e);
          localStorage.removeItem("pending-routine-add");
        }
      }
    };

    // Check immediately and also set up delays for navigation timing
    checkPendingAdd();
    const timeoutId1 = setTimeout(checkPendingAdd, 100);
    const timeoutId2 = setTimeout(checkPendingAdd, 500);
    const timeoutId3 = setTimeout(checkPendingAdd, 1000);

    return () => {
      window.removeEventListener(
        "addToRoutine",
        handleAddToRoutine as EventListener,
      );
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [isLoaded, addProductToSlot]);

  return {
    routine,
    isLoaded,
    addProductToSlot,
    removeProductFromSlot,
    clearRoutine,
    merchantOfferError,
    isRetryingOffers,
    retryMerchantOffers,
  };
};
