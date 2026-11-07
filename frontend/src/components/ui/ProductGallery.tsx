"use client";
import React, { useState, useMemo } from "react";
import ProductImage from "@/components/ui/ProductImage";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface ProductImageGalleryProps {
  imageUrls: string[];
}

const ProductImageGallery = ({ imageUrls }: ProductImageGalleryProps) => {
  // Clean the data for empty strings
  const validImages = useMemo(() => {
    return imageUrls.filter((url) => url && url.trim() !== "");
  }, [imageUrls]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // If no images exist after filtering, return null or a placeholder
  if (validImages.length === 0) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-600">
        <ImageOff size={32} aria-hidden="true" />
        <span className="text-sm font-medium">Image unavailable</span>
      </div>
    );
  }

  // Left and Right Arrows
  const nextSlide = () => {
    setSelectedIndex((prev) => (prev + 1) % validImages.length);
  };

  const prevSlide = () => {
    setSelectedIndex(
      (prev) => (prev - 1 + validImages.length) % validImages.length,
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* The Carousel */}
      <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-zinc-100 group">
        {/* Sliding Track */}
        <div
          className="flex h-full w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
        >
          {validImages.map((url, index) => (
            <div
              key={index}
              className="min-w-full h-full relative flex items-center justify-center"
            >
              <ProductImage
                src={url}
                alt={`Product view ${index + 1}`}
                fill
                className="object-contain p-2"
                priority={index === 0}
                sizes="(max-width: 1024px) 100vw, 400px"
              />
            </div>
          ))}
        </div>

        {/* Keep the gallery controls quiet until hover or keyboard focus. */}
          <>
            <button
              type="button"
              aria-label="Previous product image"
              aria-hidden={validImages.length === 1}
              tabIndex={validImages.length === 1 ? -1 : 0}
              onClick={prevSlide}
              className={`absolute left-2 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 shadow-sm transition-all hover:scale-105 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none ${validImages.length === 1 ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"}`}
            >
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </button>
            <button
              type="button"
              aria-label="Next product image"
              aria-hidden={validImages.length === 1}
              tabIndex={validImages.length === 1 ? -1 : 0}
              onClick={nextSlide}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 shadow-sm transition-all hover:scale-105 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none ${validImages.length === 1 ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100"}`}
            >
              <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>
          </>
      </div>

      {/*Thumbnails At Bottom  */}
      <div className="grid grid-cols-5 gap-3">
        {validImages.map((url, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            type="button"
            aria-label={`Show product image ${index + 1} of ${validImages.length}`}
            aria-current={selectedIndex === index ? "true" : undefined}
            className={`
              relative aspect-square overflow-hidden rounded-md transition-all duration-300 motion-reduce:transition-none
              ${
                selectedIndex === index
                  ? "ring-2 ring-zinc-800 ring-offset-2 opacity-100"
                  : "opacity-60 hover:opacity-100 hover:ring-2 hover:ring-zinc-300 hover:ring-offset-1"
              }
            `}
          >
            <ProductImage
              src={url}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;
