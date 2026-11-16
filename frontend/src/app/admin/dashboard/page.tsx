import Link from "next/link";
import { Users, Layers3, Star } from "lucide-react";
import { MetricCard } from "@/components/admin/MetricCard";
import { AdminTrendChart } from "@/components/admin/AdminTrendChart";
import { AdminRefreshButton } from "@/components/admin/AdminRefreshButton";
import { getAdminDashboardStatsServer } from "@/lib/admin-server";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const requestedDays = Number(params.days);
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const mode = params.mode === "cumulative" ? "cumulative" : "daily";
  let stats;
  try {
    stats = await getAdminDashboardStatsServer(days);
  } catch (e: unknown) {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
        <p>{e instanceof Error ? e.message : "Could not load dashboard stats."}</p>
        <AdminRefreshButton />
      </div>
    );
  }

  const { totals, series, period, topAuthors } = stats;
  const dateFormat = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const startLabel = dateFormat.format(new Date(`${period.startDate}T00:00:00Z`));
  const endLabel = dateFormat.format(new Date(`${period.endDate}T00:00:00Z`));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-700">{startLabel} – {endLabel}</p>
          <p className="mt-1 text-sm text-zinc-500">Activity counts use complete UTC days.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav aria-label="Trend date range" className="grid w-full grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1 sm:w-64">
            {[7, 30, 90].map((range) => (
              <Link key={range} href={`/admin/dashboard?days=${range}&mode=${mode}`} aria-current={days === range ? "page" : undefined}
                className={`flex min-h-11 select-none touch-manipulation items-center justify-center rounded-lg whitespace-nowrap px-3 text-sm font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow] duration-150 active:duration-0 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4b84] ${days === range ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-950/5 active:bg-zinc-50" : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900 active:bg-zinc-200/80 active:text-zinc-950"}`}>
                {range} days
              </Link>
            ))}
          </nav>
          <nav aria-label="Trend display mode" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 sm:w-64">
            {(["daily", "cumulative"] as const).map((displayMode) => (
              <Link key={displayMode} href={`/admin/dashboard?days=${days}&mode=${displayMode}`} aria-current={mode === displayMode ? "page" : undefined}
                className={`flex min-h-11 select-none touch-manipulation items-center justify-center rounded-lg whitespace-nowrap px-3 text-sm font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow] duration-150 active:duration-0 motion-reduce:transition-none capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4b84] ${mode === displayMode ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-950/5 active:bg-zinc-50" : "text-zinc-500 hover:bg-white/60 hover:text-zinc-900 active:bg-zinc-200/80 active:text-zinc-950"}`}>
                {displayMode}
              </Link>
            ))}
          </nav>
          <AdminRefreshButton />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={<Layers3 className="h-4 w-4 text-zinc-500" />}
          label="Total routines · lifetime"
          value={totals.routines}
        />
        <MetricCard
          icon={<Users className="h-4 w-4 text-zinc-500" />}
          label="Total users · lifetime"
          value={totals.users}
        />
        <MetricCard
          icon={<Star className="h-4 w-4 text-zinc-500" />}
          label="Featured routines · current"
          value={totals.featuredRoutines}
        />
      </div>

      <section aria-label="Selected period comparison" className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        {([
          ["New users", period.users, period.previousUsers],
          ["Routines created", period.routines, period.previousRoutines],
        ] as const).map(([label, current, previous]) => (
          <p key={label} className="text-sm text-zinc-700">
            <span className="font-medium">{label} this period:</span> {current.toLocaleString()} <span className="text-zinc-500">vs {previous.toLocaleString()} in the previous {days} complete days</span>
          </p>
        ))}
      </section>

      <AdminTrendChart key={`${days}-${mode}`} series={series} mode={mode} />

      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Top contributors
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Users with the most routines in the database (admin analytics).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Routines</th>
              </tr>
            </thead>
            <tbody>
              {topAuthors.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-zinc-500"
                  >
                    No data yet.
                  </td>
                </tr>
              ) : (
                topAuthors.map((row) => (
                  <tr
                    key={row.userId}
                    className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50/80"
                  >
                    <td className="px-6 py-3 font-medium text-zinc-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-3 text-zinc-600">{row.email}</td>
                    <td className="px-6 py-3 text-right tabular-nums text-zinc-900">
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
