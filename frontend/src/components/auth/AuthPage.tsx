import type { ReactNode } from "react";

export const authInputClass =
  "min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-brand/20 aria-invalid:border-red-600";

export const authLabelClass =
  "mb-2 block text-sm font-medium text-zinc-700";

export const authLinkClass =
  "inline-flex min-h-11 items-center rounded-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative z-1 mx-auto w-full max-w-[488px] px-6 pt-32 pb-16 sm:pt-40">
      <header className="mb-7">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
      </header>
      {children}
    </main>
  );
}
