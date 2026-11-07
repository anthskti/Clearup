export const navItems = [
  { name: "Builder", href: "/builder" },
  { name: "Products", href: "/products" },
  { name: "Routines", href: "/routines" },
] as const;

export const productCategories = [
  { name: "Cleansers", href: "/products/category/cleanser" },
  { name: "Toners", href: "/products/category/toner" },
  { name: "Essences", href: "/products/category/essence" },
  { name: "Serums", href: "/products/category/serum" },
  { name: "Eye Care", href: "/products/category/eyecare" },
  { name: "Moisturizers", href: "/products/category/moisturizer" },
  { name: "Sunscreens", href: "/products/category/sunscreen" },
] as const;

export const accountLinkClass =
  "flex min-h-11 items-center rounded-lg px-3 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-brand";

export const authButtonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-900/20 bg-white/75 px-3 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white active:bg-white focus-visible:outline-2 focus-visible:outline-brand";
