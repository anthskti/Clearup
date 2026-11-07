"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { navItems, productCategories } from "./navConfig";

const getRelatedNode = (target: EventTarget | null): Node | null =>
  typeof Node !== "undefined" && target instanceof Node ? target : null;

type DesktopNavProps = {
  path: string;
  isProductsMenuOpen: boolean;
  isProductsPinnedOpen: boolean;
  productsDropdownRef: RefObject<HTMLDivElement | null>;
  productsMenuRef: RefObject<HTMLDivElement | null>;
  productsButtonRef: RefObject<HTMLButtonElement | null>;
  setIsProductsOpen: (open: boolean) => void;
  setIsProductsPinnedOpen: (open: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
};

export default function DesktopNav({
  path,
  isProductsMenuOpen,
  isProductsPinnedOpen,
  productsDropdownRef,
  productsMenuRef,
  productsButtonRef,
  setIsProductsOpen,
  setIsProductsPinnedOpen,
  setIsProfileOpen,
}: DesktopNavProps) {
  return (
    <div className="hidden items-center gap-7 lg:flex">
      {navItems.map((item) => {
        const active =
          item.href === "/products"
            ? path.startsWith("/products")
            : path === item.href;
        const linkClass = `inline-flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
          active
            ? "border-brand text-brand"
            : "border-transparent text-zinc-900 hover:text-brand"
        }`;

        if (item.name === "Products") {
          return (
            <div
              key={item.href}
              className="relative flex items-center gap-1 after:absolute after:inset-x-0 after:top-full after:h-[14px] after:content-['']"
              ref={productsDropdownRef}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setIsProductsOpen(true);
              }}
              onPointerLeave={(event) => {
                const nextTarget = getRelatedNode(event.relatedTarget);
                if (
                  !productsMenuRef.current?.contains(nextTarget) &&
                  !productsDropdownRef.current?.contains(
                    document.activeElement,
                  ) &&
                  !productsMenuRef.current?.contains(document.activeElement)
                ) {
                  setIsProductsOpen(false);
                }
              }}
              onFocusCapture={() => setIsProductsOpen(true)}
              onBlur={(event) => {
                const nextTarget = getRelatedNode(event.relatedTarget);
                if (
                  !event.currentTarget.contains(nextTarget) &&
                  !productsMenuRef.current?.contains(nextTarget)
                ) {
                  setIsProductsOpen(false);
                  setIsProductsPinnedOpen(false);
                }
              }}
            >
              <Link
                href={item.href}
                onClick={() => {
                  setIsProductsOpen(false);
                  setIsProductsPinnedOpen(false);
                }}
                aria-current={path === item.href ? "page" : undefined}
                className={linkClass}
              >
                {item.name}
              </Link>
              <button
                ref={productsButtonRef}
                type="button"
                onClick={() => {
                  if (isProductsPinnedOpen) {
                    setIsProductsOpen(false);
                    setIsProductsPinnedOpen(false);
                  } else {
                    setIsProductsPinnedOpen(true);
                  }
                  setIsProfileOpen(false);
                }}
                className={`inline-flex min-h-11 items-center justify-center rounded-md px-1 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${active ? "text-brand" : "text-zinc-900"}`}
                aria-label="Browse product categories"
                aria-expanded={isProductsMenuOpen}
                aria-controls="product-categories-menu"
              >
                <ChevronDown
                  className={`size-4 transition-transform duration-150 motion-reduce:transition-none ${isProductsMenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <div
                ref={productsMenuRef}
                id="product-categories-menu"
                aria-hidden={!isProductsMenuOpen}
                inert={!isProductsMenuOpen}
                onPointerLeave={(event) => {
                  const nextTarget = getRelatedNode(event.relatedTarget);
                  if (
                    !productsDropdownRef.current?.contains(nextTarget) &&
                    !productsMenuRef.current?.contains(document.activeElement)
                  ) {
                    setIsProductsOpen(false);
                  }
                }}
                onBlur={(event) => {
                  const nextTarget = getRelatedNode(event.relatedTarget);
                  if (
                    !productsDropdownRef.current?.contains(nextTarget) &&
                    !event.currentTarget.contains(nextTarget)
                  ) {
                    setIsProductsOpen(false);
                  }
                }}
                className={`fixed inset-x-0 top-[72px] z-20 hidden border-b border-zinc-900/10 bg-canvas/95 shadow-sm backdrop-blur-lg supports-[backdrop-filter]:bg-canvas/90 transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:transition-none lg:block ${
                  isProductsMenuOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible pointer-events-none opacity-0"
                }`}
              >
                <div className="mx-auto grid max-w-7xl grid-cols-[auto_repeat(7,minmax(0,1fr))] items-center gap-2 px-6 py-2">
                  <span className="pr-3 text-xs font-semibold tracking-wide text-zinc-500">
                    Browse categories
                  </span>
                  {productCategories.map((category) => {
                    const categoryActive = path === category.href;
                    return (
                      <Link
                        key={category.href}
                        href={category.href}
                        onClick={() => {
                          setIsProductsOpen(false);
                          setIsProductsPinnedOpen(false);
                        }}
                        aria-current={categoryActive ? "page" : undefined}
                        className={`flex min-h-11 items-center justify-center whitespace-nowrap border-b-2 px-2 text-sm font-medium transition-colors focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-brand ${
                          categoryActive
                            ? "border-brand text-brand"
                            : "border-transparent text-zinc-700 hover:text-brand"
                        }`}
                      >
                        {category.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={path === item.href ? "page" : undefined}
            className={linkClass}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
