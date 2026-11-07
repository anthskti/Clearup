import Link from "next/link";
import { ExternalLink } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import { Button } from "@/components/ui/button";
import ProceduralWave from "@/components/themes/ProceduralWave";
import { getRoutineById, getRoutineWithProducts } from "@/lib/routines";
import {
  getMerchantOffersByProductIds,
  pickLowestPriceOffer,
} from "@/lib/products";
import { effectiveRoutineProductCategory } from "@/lib/routineProductCategory";

import DeleteRoutineButton from "@/components/routine/DeleteRoutineButton";
import RoutineDetailsEditor from "@/components/routine/RoutineDetailsEditor";
import RoutineUsageSection from "@/components/routine/RoutineUsageSection";
import { skinTypeLabel } from "@/lib/routineSkinTypeTags";
import RoutineShareLink from "@/components/routine/RoutineShareLink";
import { getEffectiveUser } from "@/lib/auth";
import { headers } from "next/headers";
import { Metadata } from "next";

interface RoutineProps {
  params: Promise<{ id: string }>;
}

const ROUTINE_SLOTS = [
  { id: "cleanser", label: "Cleanser" },
  { id: "toner", label: "Toner" },
  { id: "essence", label: "Essence" },
  { id: "serum", label: "Serum" },
  { id: "eyecare", label: "Eye Care" },
  { id: "moisturizer", label: "Moisturizer" },
  { id: "sunscreen", label: "Sunscreen" },
  { id: "other", label: "Other" },
];

export async function generateMetadata({
  params,
}: RoutineProps): Promise<Metadata> {
  const { id } = await params;

  if (!id?.trim()) {
    return { title: "Routine Not Found | Clearup" };
  }

  try {
    const routine = await getRoutineById(id);

    if (routine?.name) {
      return {
        title: `${routine.name} | Clearup`,
        description: `View ${routine.name} and explore this skincare routine on Clearup.`,
      };
    }
  } catch {
    return { title: "Routine | Clearup" };
  }
  return { title: "Routine | Clearup" };
}

export default async function ViewRoutine({ params }: RoutineProps) {
  const { id } = await params;
  const routineData = await getRoutineWithProducts(id);
  const routineProducts = routineData?.products ?? [];

  const headersList = await headers();
  const cookieString = headersList.get("cookie") || "";
  let effectiveUser = null;

  try {
    effectiveUser = await getEffectiveUser(cookieString);
  } catch (error) {
    console.error("User fetch failed:", error);
  }

  if (!routineData) {
    return <div>Routine not found</div>;
  }

  const productIds =
    routineProducts
      ?.map((rp) => rp.product?.id)
      .filter((id): id is number => typeof id === "number" && id > 0) ?? [];
  const offersByProductId = await getMerchantOffersByProductIds(productIds);

  const canEditRoutine =
    effectiveUser?.id === routineData.userId || effectiveUser?.role === "admin";

  const finalRoutine = ROUTINE_SLOTS.map((slot) => {
    const products =
      routineProducts
        ?.filter(
          (p) =>
            effectiveRoutineProductCategory(p) === slot.id && p.product,
        )
        .map((item) => item.product!) ?? [];
    return {
      ...slot,
      products,
    };
  }).filter((step) => step.products.length > 0);

  const getDisplayPrice = (productId: number): number | null => {
    const best = pickLowestPriceOffer(offersByProductId[productId] ?? []);
    return best?.price ?? null;
  };

  const sumDisplayPrices = (products: { id: number }[]): number | null => {
    const prices = products
      .map((product) => getDisplayPrice(product.id))
      .filter((price): price is number => price !== null);
    return prices.length ? prices.reduce((sum, price) => sum + price, 0) : null;
  };

  const totalPrice = sumDisplayPrices(
    finalRoutine.flatMap((step) => step.products),
  );
  const totalItems = finalRoutine.reduce(
    (acc, step) => acc + step.products.length,
    0,
  );
  const authorName = routineData.author?.name || "ClearUp User";

  return (
    <div className="relative min-h-screen w-full bg-[#F8F8F8]">
      <ProceduralWave 
        seed={123}
        frequency={2}
        height={190} 
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <div className="relative z-1 max-w-6xl mx-auto px-4 pt-34 pb-20 sm:px-6">
        <header className="mb-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8 lg:grid-cols-[minmax(0,1fr)_480px]">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl">{routineData.name}</h1>
            <p className="mt-3 text-sm text-zinc-500">by <span className="font-medium text-zinc-700">{authorName}</span></p>
            {(canEditRoutine || routineData.description?.trim()) && <div className="mt-4 max-w-prose">
              {canEditRoutine && (
                <div className="mb-1 flex items-center justify-between gap-3 md:justify-start">
                  <h2 className="text-sm font-medium text-zinc-500">Description</h2>
                  <RoutineDetailsEditor routineId={routineData.id} canEdit initialDescription={routineData.description} />
                </div>
              )}
              {routineData.description?.trim() && (
                <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-zinc-600">{routineData.description}</p>
              )}
            </div>}
          </div>
          <aside aria-label="Routine total price" className="self-start rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:justify-between">
              <div>
                <h2 className="text-sm font-medium text-zinc-500">Total price</h2>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{totalPrice === null ? "Price unavailable" : `CA $${totalPrice.toFixed(2)}`}</p>
                <p className="mt-1 text-xs text-zinc-500">{totalItems} products</p>
              </div>
              {routineData.skinTypeTags.length > 0 && (
                <div className="max-w-32">
                  <p className="mb-2 text-xs font-medium text-zinc-500">Skin types</p>
                  <p className="text-sm leading-relaxed text-zinc-700">{routineData.skinTypeTags.map(skinTypeLabel).join(" · ")}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex items-start gap-2 border-t border-zinc-100 pt-4">
              <RoutineShareLink routineId={id} />
              {canEditRoutine && <DeleteRoutineButton routineId={routineData.id} />}
            </div>
          </aside>
        </header>

        <section aria-labelledby="routine-products-title">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 id="routine-products-title" className="text-xl font-semibold text-zinc-900">The products</h2>
            <span className="text-xs text-zinc-500">Prices in CAD</span>
          </div>
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 text-zinc-600 font-semibold text-sm border-b border-zinc-200 px-2 pb-2 mb-2">
          <div className="col-span-2">Category</div>
          <div className="col-span-6">Product selection</div>
          <div className="col-span-1 text-center">Seller</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-1" /> {/* Buy */}
        </div>

        {/* Showing Route */}
        <div className="space-y-4 md:space-y-0">
          {finalRoutine.map((step) => {
            const stepPrice = sumDisplayPrices(step.products);
            return (
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
                <span className="font-semibold text-zinc-900 text-sm md:text-xs">
                  {step.label}
                </span>
                {/* Mobile Price Display, top corner */}
                {step.products.length > 0 && (
                  <span className="md:hidden font-bold text-zinc-900">
                    {stepPrice === null ? "-" : `CA $${stepPrice.toFixed(2)}`}
                  </span>
                )}
              </div>

              {step.products.length > 0 ? (
                step.products.map((prod) => {
                  const best = pickLowestPriceOffer(
                    offersByProductId[prod.id] ?? [],
                  );
                  const displayPrice = getDisplayPrice(prod.id);
                  const merchantName = best?.merchant?.name ?? "Direct";
                  const merchantHref = best?.website?.trim() || undefined;
                  const logo = best?.merchant?.logo?.trim();

                  return (
                    <div key={prod.id} className="col-span-1 md:contents">
                      <div className="flex items-center gap-4 md:col-span-6 md:col-start-3">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-100 rounded-md border border-zinc-200 shrink-0 overflow-hidden">
                          {prod.imageUrls && prod.imageUrls[0] ? (
                            <ProductImage
                              src={prod.imageUrls[0]}
                              alt={prod.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
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
                            className="block text-sm leading-5 transition-colors hover:text-blue-800 hover:underline"
                          >
                            <span className="font-medium text-zinc-600">{prod.brand}</span>
                            <span aria-hidden="true" className="mx-1 mb-[0.12em] inline-block size-0.5 rounded-full bg-zinc-500 align-middle" />
                            <span className="font-semibold text-zinc-900">{prod.name}</span>
                          </Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                            {displayPrice !== null && <span className="text-sm font-medium text-zinc-700">CA ${displayPrice.toFixed(2)}</span>}
                            <span className="text-xs text-zinc-500">via</span>
                            {merchantHref ? (
                              <a
                                href={merchantHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Visit ${merchantName} for ${prod.name}`}
                                className="inline-flex min-h-11 items-center gap-0.5 text-xs font-medium text-[#0e4a84] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84]"
                              >
                                {merchantName} <ExternalLink size={13} aria-hidden="true" />
                              </a>
                            ) : <span className="text-xs text-zinc-500">{merchantName}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex md:col-span-1 items-center justify-center">
                        <div className="flex items-center gap-2 p-3 bg-white border border-zinc-200 rounded text-xs font-bold text-zinc-700 shadow-sm min-h-[44px]">
                          {logo &&
                          logo !== "-" &&
                          /^https?:\/\//i.test(logo) ? (
                            <ProductImage
                              src={logo}
                              alt={merchantName}
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded object-cover shrink-0"
                              sizes="20px"
                            />
                          ) : (
                            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[10px] text-blue-700 shrink-0">
                              {merchantName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-2 text-right text-lg font-bold text-zinc-900">
                        {displayPrice === null
                          ? "-"
                          : `$${displayPrice.toFixed(2)}`}
                      </div>

                      <div className="hidden md:flex md:col-span-1 items-center justify-end">
                        {merchantHref && (
                          <Button asChild variant="secondary" size="sm">
                            <a href={merchantHref} target="_blank" rel="noopener noreferrer" aria-label={`Buy ${prod.name} at ${merchantName}`}>Buy</a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : null}
              </div>
            );
          })}
        </div>
        </section>
        <RoutineUsageSection routineId={routineData.id} canEdit={canEditRoutine} products={routineProducts} />
      </div>
    </div>
  );
}
