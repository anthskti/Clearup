"use client";

import { useState } from "react";
import ProductImage from "@/components/ui/ProductImage";
import dynamic from "next/dynamic";
import { ChevronDown, ExternalLink, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthRetryButton } from "@/components/AuthRetryButton";
import ProductImageGallery from "@/components/ui/ProductGallery";
import ProceduralWave from "@/components/themes/ProceduralWave";
import getProductData from "@/components/product/details";
import { DETAIL_CONFIG } from "@/components/product/details";
import AddToRoutineButton from "@/components/routine/AddToRoutineButton";
import ProductRating from "@/components/product/ProductRating";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";

import { Product } from "@/types/product";
import { ProductMerchantWithDetails } from "@/types/merchant";
import { cn } from "@/lib/utils";

const AddMerchantModal = dynamic(() => import("./AddMerchantModal"), {
  ssr: false, // It's a modal, it doesn't need to be on the server
});

interface ProductClientProps {
  product: Product;
  merchantList: ProductMerchantWithDetails[];
}

export default function ProductClient({
  product,
  merchantList,
}: ProductClientProps) {
  const config =
    DETAIL_CONFIG[product.category] ?? DETAIL_CONFIG.default;

  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const { isAdmin, error: roleError, retryAt, retry: retryRole } = useEffectiveRole();
  const hasIngredients = Boolean(product.ingredients);
  const facts = config.sheet.map((entry) => ({
    ...entry,
    value: getProductData(product, entry.dataKey),
  }));

  return (
    <div className="relative mt-18 min-h-screen w-full bg-[#F8F8F8] pt-8">
      <ProceduralWave 
        seed={20}
        offset={1}
        height={140} 
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <AddMerchantModal
        isOpen={isMerchantModalOpen}
        onClose={() => setIsMerchantModalOpen(false)}
        productId={product.id}
      />
      <main className="relative z-1 mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Visuals */}
        <div className="lg:col-span-5 space-y-4">
          <ProductImageGallery imageUrls={product.imageUrls} />
        </div>

        {/* Right Column: Data & Actions */}
        <div className="lg:col-span-7 flex flex-col">
          {/* 1. Brand and Product Name */}
          <div className="mb-6">
            <h1 className="mb-1 max-w-2xl text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl lg:text-4xl">
              <span className="font-semibold text-zinc-600">{product.brand}</span>
              <span
                aria-hidden="true"
                className="mx-1.5 mb-[0.12em] inline-block size-1.5 shrink-0 rounded-full bg-zinc-500 align-middle"
              />
              <span>{product.name}</span>
            </h1>
            <ProductRating
              averageRating={product.averageRating}
              reviewCount={product.reviewCount}
              variant="detail"
              className="mt-2"
            />
          </div>

          {/* 2. Add to Routine */}
          <div className="bg-white p-4 border border-zinc-100 rounded-lg shadow-md mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-xs font-bold text-zinc-600">
                Database Status
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Indexed & Tracked
              </div>
            </div>
            <AddToRoutineButton
              product={product}
              category={product.category}
              variant="secondary"
            />
          </div>

          {/* 3. Detail Sheet */}
          <div className="mb-6 space-y-6 border-t border-zinc-200 pt-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Product details
              </h2>
            </div>

            {/* Grid Layout for Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-8">
              {facts.map((fact) => (
                  <div key={fact.dataKey} className="min-w-0">
                    <div>
                      <span className="block text-sm font-medium text-zinc-600">
                        {fact.label === "SkinType" ? "Skin type" : fact.label === "Country of Origin" ? "Country of origin" : fact.label === "Key Active" ? "Key active" : fact.label}
                      </span>
                      <span className="block text-base font-semibold text-zinc-900">
                        {fact.value === "-" ? "Not listed" : fact.value}
                      </span>
                    </div>
                  </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-200">
              <h2 className="mb-3 text-lg font-semibold text-zinc-900">How to use</h2>
              <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-zinc-700">
                {product.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            {hasIngredients && (
              <div className="pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIngredientsOpen((open) => !open)}
                  aria-expanded={ingredientsOpen}
                  className="inline-flex min-h-11 items-center gap-1.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span className="text-lg font-semibold text-zinc-900">Full ingredients</span>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "shrink-0 text-zinc-700 transition-transform duration-200 motion-reduce:transition-none",
                      ingredientsOpen && "rotate-180",
                    )}
                  />
                </button>
                {ingredientsOpen && (
                  <p className="mt-3 text-base leading-relaxed text-zinc-700">
                    {product.ingredients}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Merchant Tracker, Implement through admin. Might Add Datascrapper in future.  */}
          <div className="mt-auto border-t border-zinc-200 pt-4">
            <div className="mb-4 flex justify-between items-end">
              <h2 className="text-lg font-semibold text-zinc-900">Marketplace data</h2>
              {roleError ? (
                <AuthRetryButton retryAt={retryAt} onRetry={retryRole} label="Admin access check unavailable · Retry" variant="outline" />
              ) : isAdmin ? (
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMerchantModalOpen(true)}
                  >
                    Add Seller Info
                  </Button>
                </span>
              ) : null}
            </div>

            {merchantList.length === 0 ? (
              <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                No store offers are available for this product yet.
              </p>
            ) : (
            <div className="overflow-hidden rounded-lg">
              <table className="w-full table-fixed text-left text-xs sm:text-sm">
                <colgroup><col className="w-[23%]" /><col className="w-[27%]" /><col className="w-[25%]" /><col className="w-[25%]" /></colgroup>
                <thead className="border-b border-zinc-200 text-xs font-medium text-zinc-600">
                  <tr>
                    <th className="px-1 py-3 text-center sm:px-4">Seller</th>
                    <th className="px-1 py-3 sm:px-4"><span className="sm:hidden">Stock</span><span className="hidden sm:inline">Availability</span></th>
                    <th className="px-1 py-3 text-right sm:px-4">Price</th>
                    <th className="px-1 py-3 text-right sm:px-4">Store</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {merchantList.map((merchant, index) => (
                    <tr
                      key={index}
                      className="border-b border-zinc-200 transition-colors hover:bg-zinc-50"
                    >
                      <td className="px-1 py-4 font-medium text-zinc-900 sm:px-4">
                        <div className="flex flex-col items-center">
                          <ProductImage
                            src={merchant.merchant?.logo || ""}
                            alt={merchant.merchant?.name || "Unknown Merchant"}
                            width={20}
                            height={20}
                            className="object-cover"
                            sizes="20px"
                          />
                          <span className="break-words text-xs text-zinc-600">
                            {merchant.merchant?.name || "Unknown Merchant"}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-4 sm:px-4">
                        {merchant.price == null ? (
                          <span className="text-zinc-600 italic">
                            Availability unverified
                          </span>
                        ) : merchant.stock ? (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-100 bg-emerald-50 px-1 py-1 text-xs font-medium text-emerald-700 sm:px-2">
                            <Check size={12} className="hidden shrink-0 sm:block" /> In stock
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">
                            Out of stock
                          </span>
                        )}
                        <div className="mt-1 break-words text-xs text-zinc-600">
                          {merchant.shipping}
                        </div>
                      </td>
                      <td className="px-1 py-4 text-right font-bold text-zinc-900 sm:px-4">
                        {merchant.price == null
                          ? "Price unavailable"
                          : `CA $${merchant.price.toFixed(2)}`}
                      </td>
                      <td className="px-1 py-4 text-right sm:px-4">
                        <a
                          href={merchant.website}
                          className="inline-flex min-h-11 items-center justify-end gap-1 text-xs font-semibold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          Visit store <ExternalLink size={12} className="hidden shrink-0 sm:block" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>

        {/* Compatibility Products --Implement algo for similar products later. */}
        {/* <div className="col-span-1 lg:col-span-12 mt-4 pt-10 border-t border-zinc-200">
          <h3 className="text-xl font-bold text-zinc-900">
            Often Paired In Routines
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            Mock Suggestion Cards
            {product.compatible.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-square bg-zinc-100 mb-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="text-xs text-zinc-500 uppercase font-bold tracking-wide">
                  {item.brand}
                </div>
                <div className="text-sm text-zinc-800 group-hover:underline">
                  {item.name}
                </div>
                 <div className="mt-2 text-xs text-[#0E4B84] flex items-center gap-1">
                  <Plus size={12} /> Add to Routine
                </div> 
              </div>
            ))}
           </div>
        </div> */}

        {/* Comment Section */}
        <div className="col-span-1 lg:col-span-12 mt-4 py-10 border-t border-zinc-200">
          {/*   <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">
                Community Comments
              </h3>
            </div>
            <Button variant="outline">Add a Comment</Button>
          </div>

          <div className="space-y-8"> */}
          {/* Comment 1 */}
          {/* <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                T1
              </div>
              <div className="grow">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-zinc-900 text-sm">
                    TestUser1
                  </span>
                  <span className="text-xs text-zinc-400">2 days ago</span>
                </div> */}

          {/* User "Metadata" Tags - Crucial for a Database feel */}
          {/* <div className="flex flex-wrap gap-2 my-2">
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] uppercase tracking-wide font-bold rounded">
                    Oily Skin
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] uppercase tracking-wide font-bold rounded">
                    Acne Prone
                  </span>
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed">
                  It gave me a glass skin look within a few week of consistent
                  use! I recommend you pair it with a good moisturizer to lock
                  in the hydration.
                </p>

                <div className="mt-3 flex gap-4 text-xs text-zinc-400 font-medium cursor-pointer">
                  <span className="hover:text-zinc-600">Helpful (12)</span>
                  <span className="hover:text-zinc-600">Reply</span>
                </div>
              </div>
            </div> */}

          {/* Comment 2 */}
          {/* <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-sm">
                T2
              </div>
              <div className="grow">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-zinc-900 text-sm">
                    TestUser2
                  </span>
                  <span className="text-xs text-zinc-400">1 week ago</span>
                </div>

                <div className="flex flex-wrap gap-2 my-2">
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] uppercase tracking-wide font-bold rounded">
                    Combination Skin
                  </span>
                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] uppercase tracking-wide font-bold rounded">
                    Sensitive
                  </span>
                </div>

                <p className="text-sm text-zinc-700 leading-relaxed">
                  Throughout work, this ampoule kept my skin hydrated. It
                  ultimately soothes my skin well even after a long day of work.
                  I highly recommend.
                </p>

                <div className="mt-3 flex gap-4 text-xs text-zinc-400 font-medium cursor-pointer">
                  <span className="hover:text-zinc-600">Helpful (4)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button className="text-sm text-zinc-500 hover:text-zinc-900 font-medium border-b border-transparent hover:border-zinc-900 pb-0.5 transition-all">
              Load more comments
            </button>
          </div>*/}
        </div>
      </main>
    </div>
  );
}
