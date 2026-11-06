import type { Metadata } from "next";
import ProceduralWave from "@/components/themes/ProceduralWave";
import GuidesFilters from "@/components/guides/GuidesFilters";
import GuidesGrid from "@/components/guides/GuidesGrid";
import GuidesPagination from "@/components/guides/GuidesPagination";
import type { GuideRoutine } from "@/types/routine";
import { getPublicGuides } from "@/lib/routines";
import { parseSkinTypeTagsFromParam } from "@/lib/routineSkinTypeTags";

export const metadata: Metadata = {
  title: "Community Routines | Clearup",
  description: "Browse public skincare routines from the Clearup community.",
};

type Props = {
  searchParams: Promise<{
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
};

export default async function CommunityRoutinesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tagsParam = sp.tags?.trim() ?? "";
  const minPriceParam = sp.minPrice?.trim() ?? "";
  const maxPriceParam = sp.maxPrice?.trim() ?? "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const limit = 24;
  const offset = (page - 1) * limit;

  const initialTags = parseSkinTypeTagsFromParam(tagsParam);
  let routines: GuideRoutine[] = [];
  try {
    routines = await getPublicGuides({
      tags: tagsParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      limit,
      offset,
    });
  } catch {}

  const hasNext = routines.length === limit;

  return (
    <div className="relative min-h-screen w-full bg-[#F8F8F8]">
      <ProceduralWave 
        seed={7}
        height={160} 
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <div className="relative z-1 mx-auto max-w-7xl px-4 pt-34 pb-20 sm:px-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Community Routines
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-600">
            Public routines from registered members. Use filters to narrow by
            skin type or routine total.
          </p>
        </header>

        <GuidesFilters
          key={`tags=${tagsParam}|min=${minPriceParam}|max=${maxPriceParam}`}
          initialTags={initialTags}
          initialMinPrice={minPriceParam}
          initialMaxPrice={maxPriceParam}
        >
          <GuidesGrid items={routines} filtered={initialTags.length > 0 || !!minPriceParam || !!maxPriceParam} />

          <GuidesPagination
            page={page}
            hasNext={hasNext}
            tags={tagsParam}
            minPrice={minPriceParam}
            maxPrice={maxPriceParam}
          />
        </GuidesFilters>
      </div>
    </div>
  );
}
