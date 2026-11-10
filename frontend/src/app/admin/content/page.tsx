import { ContentGuidesClient } from "@/components/admin/ContentGuidesClient";
import { getFeaturedRoutinesServer } from "@/lib/admin-server";

const FEATURED_CAP = 20;

export default async function AdminContentPage() {
  let featured;
  try {
    featured = await getFeaturedRoutinesServer();
  } catch (e: unknown) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
        {e instanceof Error ? e.message : "Could not load featured routines."}
      </div>
    );
  }

  const featuredKey = featured.map((f) => f.routineId).join(",");

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        Find routines by ID or URL, preview their homepage card, then arrange the featured list on the public landing page (max {FEATURED_CAP}).
      </p>
      <ContentGuidesClient
        key={featuredKey}
        initialFeatured={featured}
        featuredLimit={FEATURED_CAP}
      />
    </div>
  );
}
