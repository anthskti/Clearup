"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { ChevronDown, X } from "lucide-react";
import { navItems, productCategories } from "./navConfig";

type MobileNavDrawerProps = {
  path: string;
  mobileNavOpen: boolean;
  mobileProductsOpen: boolean;
  mobileDrawerRef: RefObject<HTMLElement | null>;
  mobileCloseRef: RefObject<HTMLButtonElement | null>;
  setMobileProductsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  onClose: () => void;
};

export default function MobileNavDrawer({
  path,
  mobileNavOpen,
  mobileProductsOpen,
  mobileDrawerRef,
  mobileCloseRef,
  setMobileProductsOpen,
  onClose,
}: MobileNavDrawerProps) {
  return (
    <>
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-zinc-950/40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        id="mobile-navigation"
        ref={mobileDrawerRef}
        role="dialog"
        aria-modal={mobileNavOpen}
        aria-label="Navigation menu"
        inert={!mobileNavOpen}
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(340px,88vw)] flex-col bg-[#f9fcfb] shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <span className="text-lg font-semibold text-zinc-900">Explore</span>
          <button
            ref={mobileCloseRef}
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-800 transition-colors hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-brand"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          aria-label="Mobile navigation"
          className="flex-1 overflow-y-auto px-4 py-5"
        >
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/products"
                  ? path.startsWith("/products")
                  : path === item.href;
              if (item.name === "Products") {
                return (
                  <li key={item.href}>
                    <div
                      className={`flex min-h-12 items-center overflow-hidden rounded-xl transition-colors focus-within:outline-2 focus-within:outline-brand ${
                        active
                          ? "bg-brand-soft text-brand"
                          : "text-zinc-900 hover:bg-white active:bg-white"
                      }`}
                    >
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={path === item.href ? "page" : undefined}
                        className="flex min-h-12 flex-1 items-center px-4 text-base font-semibold focus-visible:outline-none"
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => setMobileProductsOpen((open) => !open)}
                        className="inline-flex min-h-12 min-w-12 items-center justify-center focus-visible:outline-2 focus-visible:outline-brand"
                        aria-label={
                          mobileProductsOpen
                            ? "Hide product categories"
                            : "Show product categories"
                        }
                        aria-expanded={mobileProductsOpen}
                        aria-controls="mobile-product-categories"
                      >
                        <ChevronDown
                          className={`size-5 transition-transform duration-150 motion-reduce:transition-none ${mobileProductsOpen ? "rotate-180" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    {mobileProductsOpen && (
                      <ul
                        id="mobile-product-categories"
                        className="ml-4 border-l border-zinc-200 pl-3"
                      >
                        {productCategories.map((category) => (
                          <li key={category.href}>
                            <Link
                              href={category.href}
                              onClick={onClose}
                              aria-current={
                                path === category.href ? "page" : undefined
                              }
                              className="flex min-h-11 items-center rounded-lg px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-white active:bg-white focus-visible:outline-2 focus-visible:outline-brand"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={path === item.href ? "page" : undefined}
                    className={`flex min-h-12 items-center rounded-xl px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
                      active
                        ? "bg-brand-soft text-brand"
                        : "text-zinc-900 hover:bg-white active:bg-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
