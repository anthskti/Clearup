import Link from "next/link";
import type { MouseEvent } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { getMobilePageWindow, getPageWindow } from "@/lib/pagination";

// A 32px visual chip sits inside each 44px touch target.
const controlClass =
  "group inline-flex min-h-11 min-w-11 shrink-0 touch-manipulation select-none items-center justify-center rounded-xl text-sm font-medium tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84]";
const chipClass =
  "inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg px-2 transition-colors duration-100 motion-reduce:transition-none";

export default function PaginationControls({
  page,
  lastPage,
  pending = false,
  disabled = false,
  hrefForPage,
  onPage,
  label,
}: {
  page: number;
  lastPage: number;
  pending?: boolean;
  disabled?: boolean;
  hrefForPage?: (page: number) => string;
  onPage?: (page: number) => void;
  label: string;
}) {
  if (lastPage <= 1 && !pending) return null;

  const unavailable = pending || disabled;
  const handleLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    targetPage: number,
  ) => {
    if (unavailable || targetPage === page) {
      event.preventDefault();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    onPage?.(targetPage);
    if (onPage) event.preventDefault();
  };

  function pageControl(targetPage: number) {
    const active = targetPage === page;
    const className = `${controlClass} ${unavailable ? "pointer-events-none opacity-50" : ""}`;
    const content = (
      <span
        className={`${chipClass} relative ${active
          ? "bg-white font-semibold text-[#0e4a84] shadow-[0_1px_3px_rgb(0_0_0/0.08)] contrast-more:ring-1 contrast-more:ring-zinc-500"
          : "text-zinc-600 group-hover:bg-white/70 group-active:bg-zinc-200"}`}
      >
        <span className={active && pending ? "opacity-0" : undefined}>
          {targetPage}
        </span>
        {active && pending && (
          <LoaderCircle
            size={16}
            className="absolute animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
      </span>
    );

    if (hrefForPage) {
      return (
        <Link
          key={targetPage}
          href={hrefForPage(targetPage)}
          prefetch={false}
          scroll={false}
          aria-label={`Page ${targetPage}`}
          aria-current={active ? "page" : undefined}
          aria-disabled={unavailable || active}
          tabIndex={unavailable || active ? -1 : undefined}
          onClick={(event) => handleLinkClick(event, targetPage)}
          className={className}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={targetPage}
        type="button"
        className={className}
        aria-label={`Page ${targetPage}`}
        aria-current={active ? "page" : undefined}
        disabled={unavailable || active}
        onClick={() => onPage?.(targetPage)}
      >
        {content}
      </button>
    );
  }

  function arrowControl(direction: "previous" | "next", atBoundary: boolean) {
    const targetPage = direction === "previous" ? page - 1 : page + 1;
    const text = direction === "previous" ? "Previous" : "Next";
    const inactive = atBoundary || unavailable;
    const className = `${controlClass} ${inactive ? "pointer-events-none text-zinc-400 opacity-50" : "text-zinc-600"}`;
    const icon = direction === "previous" ? (
      <ChevronLeft size={18} aria-hidden="true" />
    ) : (
      <ChevronRight size={18} aria-hidden="true" />
    );
    const content = (
      <span
        className={`${chipClass} ${inactive ? "" : "group-hover:bg-white/70 group-active:bg-zinc-200"}`}
      >
        {icon}
      </span>
    );

    if (hrefForPage && !atBoundary) {
      return (
        <Link
          href={hrefForPage(targetPage)}
          prefetch={false}
          scroll={false}
          aria-label={`${text} page`}
          aria-disabled={unavailable}
          tabIndex={unavailable ? -1 : undefined}
          onClick={(event) => handleLinkClick(event, targetPage)}
          className={className}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        className={className}
        aria-label={`${text} page`}
        disabled={inactive}
        onClick={() => onPage?.(targetPage)}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="mt-5 flex justify-center">
      {pending && lastPage <= 1 && (
        <p
          aria-hidden="true"
          className="flex min-h-11 items-center gap-2 text-sm text-zinc-600"
        >
          <LoaderCircle
            size={16}
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Loading results…
        </p>
      )}
      {lastPage > 1 && (
        <nav
          aria-label={label}
          aria-busy={pending}
          className="inline-flex max-w-full items-center rounded-2xl bg-zinc-100 p-0.5 ring-1 ring-inset ring-zinc-900/5 contrast-more:ring-zinc-400"
        >
          {arrowControl("previous", page <= 1)}
          <div className="flex items-center sm:hidden">
            {getMobilePageWindow(page, lastPage).map((targetPage) =>
              pageControl(targetPage),
            )}
          </div>
          <div className="hidden items-center sm:flex">
            {getPageWindow(page, lastPage).map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  aria-hidden="true"
                  className="inline-flex min-h-11 w-6 items-center justify-center text-sm text-zinc-400"
                >
                  …
                </span>
              ) : (
                pageControl(item)
              ),
            )}
          </div>
          {arrowControl("next", page >= lastPage)}
        </nav>
      )}
    </div>
  );
}
