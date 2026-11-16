import type { Metadata } from "next";
import ProceduralWave from "@/components/themes/ProceduralWave";
import GuidesFilters from "@/components/guides/GuidesFilters";
import GuidesGrid from "@/components/guides/GuidesGrid";
import type { GuideRoutine } from "@/types/routine";
import { getPublicGuides } from "@/lib/routines";
import { parseSkinTypeTagsFromParam } from "@/lib/routineSkinTypeTags";
import { parsePageParam } from "@/lib/pagination";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Community Routines | Clearup",
  description: "Browse public skincare routines from the Clearup community.",
};

type Props = {
  searchParams: Promise<{
    tags?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string | string[];
  }>;
};

export default async function CommunityRoutinesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tagsParam = sp.tags?.trim() ?? "";
  const minPriceParam = sp.minPrice?.trim() ?? "";
  const maxPriceParam = sp.maxPrice?.trim() ?? "";
  const limit = 24;
  const page = parsePageParam(sp.page, limit);
  const offset = (page - 1) * limit;

  const initialTags = parseSkinTypeTagsFromParam(tagsParam);
  let routines: GuideRoutine[] = [];
  let total = 0;
  let loadError: string | null = null;
  try {
    const result = await getPublicGuides({
      tags: tagsParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      limit,
      offset,
    });
    routines = result.routines;
    total = result.total;
  } catch {
    loadError = "We couldn’t load community routines.";
  }

  const lastPage = Math.max(1, Math.ceil(total / limit));
  const resultParams = new URLSearchParams();
  if (tagsParam) resultParams.set("tags", tagsParam);
  if (minPriceParam) resultParams.set("minPrice", minPriceParam);
  if (maxPriceParam) resultParams.set("maxPrice", maxPriceParam);
  if (!loadError && page > lastPage) {
    if (lastPage > 1) resultParams.set("page", String(lastPage));
    redirect(`/routines${resultParams.size ? `?${resultParams}` : ""}`);
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F8F8F8] mt-18">
      <ProceduralWave 
        seed={7}
        height={160} 
        gradientFrom="#e9f6ff" 
        gradientTo="#f0f8fc" 
        flip={true} 
      />
      <div className="relative z-1 mx-auto max-w-7xl px-4 pt-8 pb-6 sm:px-6">
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
          initialTagsParam={tagsParam}
          initialMinPrice={minPriceParam}
          initialMaxPrice={maxPriceParam}
          page={page}
          total={total}
          loadError={loadError}
        >
          {!loadError && (
            <GuidesGrid
              items={routines}
              filtered={initialTags.length > 0 || !!minPriceParam || !!maxPriceParam}
            />
          )}
        </GuidesFilters>
      </div>
    </div>
  );
}
