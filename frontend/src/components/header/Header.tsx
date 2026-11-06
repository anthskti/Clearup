"use client";

import ClearupLogoLink from "@/components/ClearupLogoLink";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { Menu } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getSessionRetryAt, isTemporaryAuthError } from "@/lib/auth-retry";
import { broadcastSignOut } from "@/hooks/useCrossTabSignOut";
import { useEffectiveRole } from "@/hooks/useEffectiveRole";
import DesktopNav from "./DesktopNav";
import ProfileMenu from "./ProfileMenu";
import MobileNavDrawer from "./MobileNavDrawer";

const emptySubscribe = () => () => {};

function Header() {
  const path = usePathname();
  const router = useRouter();
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isProductsPinnedOpen, setIsProductsPinnedOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [navPath, setNavPath] = useState(path);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const productsDropdownRef = useRef<HTMLDivElement>(null);
  const productsMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const productsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const { data: session, isPending, error: sessionError, refetch: refetchSession } = authClient.useSession();
  const { isAdmin } = useEffectiveRole();
  const isProductsMenuOpen = isProductsOpen || isProductsPinnedOpen;
  const isHeaderMenuOpen = isProductsMenuOpen || isProfileOpen || mobileNavOpen;

  if (path !== navPath) {
    setNavPath(path);
    setMobileNavOpen(false);
    setMobileProductsOpen(false);
    setIsProductsOpen(false);
    setIsProductsPinnedOpen(false);
    setIsProfileOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
      if (
        productsDropdownRef.current &&
        !productsDropdownRef.current.contains(target) &&
        !productsMenuRef.current?.contains(target)
      ) {
        setIsProductsOpen(false);
        setIsProductsPinnedOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    let accumulatedDelta = 0;

    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);
      const delta = currentScrollY - previousScrollY;
      previousScrollY = currentScrollY;

      if (currentScrollY <= 64) {
        accumulatedDelta = 0;
        setIsHeaderHidden(false);
        return;
      }

      if (delta === 0) return;
      if (Math.sign(delta) !== Math.sign(accumulatedDelta)) {
        accumulatedDelta = 0;
      }
      accumulatedDelta += delta;

      if (Math.abs(accumulatedDelta) < 8) return;

      if (accumulatedDelta < 0) {
        setIsHeaderHidden(false);
      } else {
        const headerHasKeyboardFocus =
          headerRef.current?.contains(document.activeElement) &&
          document.activeElement?.matches(":focus-visible");
        setIsHeaderHidden(!isHeaderMenuOpen && !headerHasKeyboardFocus);
      }
      accumulatedDelta = 0;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeaderMenuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mobileCloseRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        mobileButtonRef.current?.focus();
      }
      if (event.key !== "Tab") return;

      const focusable = mobileDrawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isProfileOpen) profileButtonRef.current?.focus();
      if (isProductsMenuOpen) productsButtonRef.current?.focus();
      setIsProfileOpen(false);
      setIsProductsOpen(false);
      setIsProductsPinnedOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isProfileOpen, isProductsMenuOpen]);

  const handleSignOut = async () => {
    await authClient.signOut();
    broadcastSignOut();
    router.push("/");
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
    mobileButtonRef.current?.focus();
  };

  return (
    <header
      ref={headerRef}
      inert={isHeaderHidden}
      aria-hidden={isHeaderHidden}
      onFocusCapture={() => setIsHeaderHidden(false)}
      className={`fixed inset-x-0 top-0 z-20 transition-transform duration-200 ease-out motion-reduce:transition-none ${
        isHeaderHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] border-b border-zinc-900/5 bg-white shadow-sm"
      />
      <nav
        aria-label="Main navigation"
        className="relative z-10 mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-6"
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            ref={mobileButtonRef}
            type="button"
            onClick={() => {
              setMobileProductsOpen(path.startsWith("/products/category/"));
              setMobileNavOpen(true);
            }}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-zinc-900 transition-colors hover:bg-white/60 active:bg-white/80 focus-visible:outline-2 focus-visible:outline-brand lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="size-5" />
          </button>
          <ClearupLogoLink priority />
        </div>

        <DesktopNav
          path={path}
          isProductsMenuOpen={isProductsMenuOpen}
          isProductsPinnedOpen={isProductsPinnedOpen}
          productsDropdownRef={productsDropdownRef}
          productsMenuRef={productsMenuRef}
          productsButtonRef={productsButtonRef}
          setIsProductsOpen={setIsProductsOpen}
          setIsProductsPinnedOpen={setIsProductsPinnedOpen}
          setIsProfileOpen={setIsProfileOpen}
        />

        <ProfileMenu
          mounted={mounted}
          isPending={isPending}
          isAuthenticated={Boolean(session)}
          isAdmin={isAdmin}
          isProfileOpen={isProfileOpen}
          userName={session?.user.name}
          userEmail={session?.user.email}
          userImage={session?.user.image}
          profileDropdownRef={profileDropdownRef}
          profileButtonRef={profileButtonRef}
          setIsProfileOpen={setIsProfileOpen}
          setIsProductsOpen={setIsProductsOpen}
          setIsProductsPinnedOpen={setIsProductsPinnedOpen}
          onSignOut={handleSignOut}
          sessionUnavailable={Boolean(sessionError && isTemporaryAuthError(sessionError))}
          retryAt={getSessionRetryAt()}
          onRetrySession={refetchSession}
        />
      </nav>

      <MobileNavDrawer
        path={path}
        mobileNavOpen={mobileNavOpen}
        mobileProductsOpen={mobileProductsOpen}
        mobileDrawerRef={mobileDrawerRef}
        mobileCloseRef={mobileCloseRef}
        setMobileProductsOpen={setMobileProductsOpen}
        onClose={closeMobileNav}
      />
    </header>
  );
}

export default Header;
