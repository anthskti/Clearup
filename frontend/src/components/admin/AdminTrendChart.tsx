"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { AdminDashboardStats } from "@/types/routine-admin";

type Props = { series: AdminDashboardStats["series"] };

function formatDate(date: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", { timeZone: "UTC", ...options }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function DailyChart({
  title,
  description,
  series,
  valueKey,
  color,
}: {
  title: string;
  description: string;
  series: Props["series"];
  valueKey: "users" | "routines";
  color: string;
}) {
  const max = Math.max(1, ...series.map((point) => point[valueKey]));
  const step = max <= 5 ? 1 : Math.ceil(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, index) => index * step);
  const [width, setWidth] = useState(320);
  const height = 220;
  const left = 42;
  const right = 12;
  const topPad = 14;
  const bottom = 184;
  const plotWidth = width - left - right;
  const plotHeight = bottom - topPad;
  const points = series.map((point, index) => ({
    ...point,
    x: left + (series.length <= 1 ? plotWidth / 2 : (index / (series.length - 1)) * plotWidth),
    y: bottom - (point[valueKey] / top) * plotHeight,
  }));
  const dateTickIndexes = Array.from(new Set([0, Math.floor((series.length - 1) / 2), series.length - 1]));
  const number = new Intl.NumberFormat("en");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [series.length]);
  const selectedIndex = Math.min(activeIndex, series.length - 1);
  const selectedPoint = points[selectedIndex];
  const selectAtPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!series.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const viewX = ((event.clientX - rect.left) / rect.width) * width;
    const index = Math.round(Math.max(0, Math.min(1, (viewX - left) / plotWidth)) * (series.length - 1));
    setActiveIndex(index);
  };
  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.min(series.length - 1, selectedIndex + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(Math.max(0, selectedIndex - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(series.length - 1);
    }
  };

  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
      {series.length === 0 ? (
        <p className="mt-8 rounded-lg bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
          No trend data for this period.
        </p>
      ) : (
        <>
          <div ref={containerRef} className="mt-4 w-full">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              ref={svgRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerMove={selectAtPointer}
              onPointerDown={selectAtPointer}
              className="h-auto w-full touch-pan-y overflow-visible focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4b84]"
              aria-label={`${title} chart. Use arrow keys to inspect daily values.`}
            >
              {ticks.map((tick) => {
                const y = bottom - (tick / top) * plotHeight;
                return (
                  <g key={tick}>
                    <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e4e4e7" strokeDasharray="3 4" />
                    <text x={left - 8} y={y + 4} textAnchor="end" fill="#71717a" fontSize="11">{number.format(tick)}</text>
                  </g>
                );
              })}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {selectedPoint && (
                <circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  r="5"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                  aria-hidden="true"
                />
              )}
              {dateTickIndexes.map((index) => {
                const point = points[index];
                if (!point) return null;
                return (
                  <text key={point.date} x={point.x} y={bottom + 23} textAnchor={index === 0 ? "start" : index === series.length - 1 ? "end" : "middle"} fill="#71717a" fontSize="11">
                    {formatDate(point.date, { month: "short", day: "numeric" })}
                  </text>
                );
              })}
            </svg>
          </div>
          <p aria-live="polite" className="mt-1 min-h-11 rounded-lg bg-zinc-50 px-3 py-3 text-sm text-zinc-800">
            <span className="font-medium">{formatDate(series[selectedIndex]?.date ?? series[0].date, { dateStyle: "long" })}</span>{" "}
            <span className="ml-2 tabular-nums">{number.format(series[selectedIndex]?.[valueKey] ?? 0)} {title.toLowerCase()}</span>
          </p>
          <details className="mt-3 border-t border-zinc-100 pt-3 text-sm">
            <summary className="min-h-11 cursor-pointer py-3 font-medium text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4b84]">
              View exact daily values
            </summary>
            <div className="mt-3 max-h-56 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white text-zinc-500">
                  <tr><th className="py-2 font-medium">UTC date</th><th className="py-2 text-right font-medium">{title}</th></tr>
                </thead>
                <tbody>
                  {series.map((point) => (
                    <tr key={point.date} className="border-t border-zinc-100">
                      <th scope="row" className="py-2 font-normal text-zinc-700">{formatDate(point.date, { dateStyle: "medium" })}</th>
                      <td className="py-2 text-right tabular-nums text-zinc-900">{number.format(point[valueKey])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}

export function AdminTrendChart({ series }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DailyChart title="New users" description="Accounts created per UTC day" series={series} valueKey="users" color="#0e4b84" />
      <DailyChart title="Routines created" description="Routines created per UTC day" series={series} valueKey="routines" color="#059669" />
    </div>
  );
}
