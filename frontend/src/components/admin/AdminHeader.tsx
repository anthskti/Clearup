"use client";

import { useEffect, useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminNavigation, adminNavItems } from "./AdminSidebar";

export default function AdminHeader() {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const currentItem = adminNavItems.find((item) => pathname.startsWith(item.href));
  const title = currentItem?.name ?? "Admin";

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setNavigationOpen(false);
    };

    closeOnDesktop(desktopQuery);
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <>
      <div className="flex min-h-16 w-full items-center gap-3">
        <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              aria-label="Open admin navigation"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-zinc-800 transition-colors hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-zinc-950/40 lg:hidden" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,88vw)] flex-col border-r border-zinc-200 bg-white shadow-xl outline-none animate-in slide-in-from-left duration-200 motion-reduce:animate-none lg:hidden">
              <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-4 pt-[env(safe-area-inset-top)]">
                <div>
                  <Dialog.Title className="text-base font-semibold text-zinc-950">
                    Clearup Admin
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Navigate between admin sections.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close admin navigation"
                    className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-800 transition-colors hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>
              <AdminNavigation onNavigate={() => setNavigationOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
          {title}
        </h1>
      </div>
    </>
  );
}
