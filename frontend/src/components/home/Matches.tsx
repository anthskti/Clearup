"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SkinType } from "@/types/product";

interface Match {
  label: string;
  skinType: SkinType;
}

/** Home-page skin concern cards → filtered category catalog links. */
const MATCHES: Match[] = [
  { label: "Normal", skinType: "normal" },
  { label: "Acne Prone", skinType: "acne-prone" },
  { label: "Combination", skinType: "combination" },
  { label: "Oil Control", skinType: "oily" },
  { label: "Dryness", skinType: "dry" },
  { label: "Sensitivity", skinType: "sensitive" },
];

function matchHref(skinType: SkinType): string {
  const qs = new URLSearchParams({ skinType });
  return `/products?${qs.toString()}`;
}

const MatchCard = ({ label, skinType }: Match) => (
  <Link
    href={matchHref(skinType)}
    className="
      group flex flex-col items-center justify-center
      w-full aspect-2/3
      bg-[#e8f6ff] hover:bg-[#87a1b1]
      rounded-sm shadow-sm transition-all duration-300
      text-zinc-900 hover:text-white font-medium
    "
  >
    {label}
  </Link>
);

const Matches = () => {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.85),
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="py-10 px-4 md:px-8 w-full mx-auto">
        <div className="text-center mb-4 lg:mb-10">
          <h2 className="text-2xl font-bold text-zinc-900">
            Find Your Perfect Match
          </h2>
        </div>
        {/* This could be abstracted into a component, copied from feature routines */}
        {/* Phone and tablet */}
        <div className="mb-4 flex justify-end gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Previous skin types"
            aria-controls="skin-type-matches"
            className="inline-flex size-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Next skin types"
            aria-controls="skin-type-matches"
            className="inline-flex size-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div
          id="skin-type-matches"
          ref={scrollerRef}
          className="lg:hidden flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {MATCHES.map((item) => (
            <div
              key={item.skinType}
              className="w-[min(78vw,300px)] shrink-0 snap-start"
            >
              <MatchCard {...item} />
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden lg:grid grid-cols-6 gap-4 w-full max-w-7xl mx-auto">
          {MATCHES.map((item) => (
            <MatchCard key={item.skinType} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Matches;
