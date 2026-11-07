import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

const pages = [
  { href: "/about-clearup", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/tos", label: "Terms" },
] as const;

export function InfoArticle({
  currentPage,
  title,
  description,
  updated,
  sections = [],
  hero,
  children,
}: {
  currentPage: (typeof pages)[number]["href"];
  title: string;
  description?: string;
  updated?: { date: string; label: string };
  sections?: { id: string; title: string }[];
  hero?: ReactNode;
  children: ReactNode;
}) {
  const contentsLinks = (
    <ul>
      {sections.map(({ id, title }) => (
        <li key={id}>
          <a
            href={`#${id}`}
            className="flex min-h-11 items-center py-2 text-sm leading-5 text-zinc-600 underline-offset-4 outline-offset-4 hover:text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
          >
            {title}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {hero}
      <article
        className={`mx-auto w-full max-w-5xl px-5 pb-20 [overflow-wrap:anywhere] sm:px-6 sm:pb-28 ${
          hero ? "pt-6 sm:pt-8" : "pt-28 sm:pt-32"
        }`}
      >
        <nav aria-label="Information pages" className="border-b border-zinc-200">
          <ul className="flex flex-wrap gap-x-6">
            {pages.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={currentPage === href ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-medium outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand ${
                    currentPage === href
                      ? "border-brand text-brand"
                      : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {!hero ? (
          <header className="mb-10 mt-10 max-w-[45rem] sm:mb-12 sm:mt-12">
            <h1 className="text-page-title font-semibold text-zinc-900">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 text-lg leading-relaxed text-zinc-600">
                {description}
              </p>
            ) : null}
            {updated ? (
              <p className="mt-4 text-sm text-zinc-500">
                Last updated <time dateTime={updated.date}>{updated.label}</time>
              </p>
            ) : null}
          </header>
        ) : null}
        <div
          className={[
            sections.length ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_12rem] lg:gap-12" : "",
            hero ? "mt-10 sm:mt-12" : "",
          ].join(" ")}
        >
          {sections.length ? (
            <nav
              aria-label="On this page"
              className="border-b border-zinc-200 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:self-start lg:border-b-0 lg:border-l lg:pl-5"
            >
              <details className="group lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-zinc-900 outline-offset-4 focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                  On this page
                  <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-zinc-500 group-open:rotate-180" />
                </summary>
                <div className="pb-4">{contentsLinks}</div>
              </details>
              <div className="hidden lg:block">
                <p className="mb-2 text-sm font-semibold text-zinc-900">On this page</p>
                {contentsLinks}
              </div>
            </nav>
          ) : null}
          <div
            className={[
              "min-w-0 max-w-[45rem] space-y-4 text-base leading-7 text-zinc-700 sm:text-[1.0625rem]",
              sections.length ? "lg:col-start-1 lg:row-start-1" : "",
              "[&_a]:break-words [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:decoration-2 focus-visible:[&_a]:outline-2 focus-visible:[&_a]:outline-offset-4 focus-visible:[&_a]:outline-brand",
              "[&_section]:scroll-mt-28 [&_section]:space-y-4 [&_section+section]:mt-12",
              "[&_h2]:text-section-title [&_h2]:font-semibold [&_h2]:text-zinc-900",
              "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6",
              "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
              "[&_strong]:font-semibold [&_strong]:text-zinc-900",
            ].join(" ")}
          >
            {children}
          </div>
        </div>
      </article>
    </>
  );
}
