"use client";

import Link from "next/link";
import type { RefObject } from "react";
import {
  UserRound,
  ChevronDown,
  Settings,
  ListPlus,
  Bookmark,
  Shield,
  LogOut,
} from "lucide-react";
import { accountLinkClass, authButtonClass } from "./navConfig";

type ProfileMenuProps = {
  mounted: boolean;
  isPending: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isProfileOpen: boolean;
  userName?: string | null;
  userEmail?: string | null;
  profileDropdownRef: RefObject<HTMLDivElement | null>;
  profileButtonRef: RefObject<HTMLButtonElement | null>;
  setIsProfileOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsProductsOpen: (open: boolean) => void;
  setIsProductsPinnedOpen: (open: boolean) => void;
  onSignOut: () => void;
};

export default function ProfileMenu({
  mounted,
  isPending,
  isAuthenticated,
  isAdmin,
  isProfileOpen,
  userName,
  userEmail,
  profileDropdownRef,
  profileButtonRef,
  setIsProfileOpen,
  setIsProductsOpen,
  setIsProductsPinnedOpen,
  onSignOut,
}: ProfileMenuProps) {
  if (!mounted || isPending) {
    return (
      <div className="flex items-center justify-end">
        <div className="size-11 shrink-0 animate-pulse rounded-xl bg-white/60 sm:w-28" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-end">
        <Link href="/login" className={authButtonClass}>
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end">
      <div
        className="relative"
        ref={profileDropdownRef}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsProfileOpen(false);
          }
        }}
      >
        <button
          ref={profileButtonRef}
          type="button"
          onClick={() => {
            setIsProfileOpen((open) => !open);
            setIsProductsOpen(false);
            setIsProductsPinnedOpen(false);
          }}
          className={`${authButtonClass} px-2 sm:px-3`}
          aria-label={isProfileOpen ? "Close account menu" : "Open account menu"}
          aria-expanded={isProfileOpen}
          aria-controls="account-menu"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-brand">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">Account</span>
          <ChevronDown
            className="hidden size-4 sm:block"
            aria-hidden="true"
          />
        </button>
        <div
          id="account-menu"
          inert={!isProfileOpen}
          className={`absolute right-0 top-full z-10 mt-2 w-64 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 shadow-lg transition-[opacity,transform] duration-150 motion-reduce:transition-none motion-reduce:transform-none ${
            isProfileOpen
              ? "opacity-100 visible scale-100"
              : "opacity-0 invisible scale-95"
          }`}
        >
          <div className="flex flex-col gap-0.5 border-b border-zinc-100 px-3 py-2">
            <span className="truncate text-sm font-semibold text-zinc-900">
              {userName}
            </span>
            <span className="truncate text-xs text-zinc-500">{userEmail}</span>
          </div>
          <div className="border-b border-zinc-100 py-1">
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsProfileOpen(false)}
                className={accountLinkClass}
              >
                <Shield className="mr-2 size-4 text-zinc-500" />
                Admin dashboard
              </Link>
            )}
            <Link
              href="/profile/preferences"
              onClick={() => setIsProfileOpen(false)}
              className={accountLinkClass}
            >
              <Settings className="mr-2 size-4 text-zinc-500" />
              Preferences
            </Link>
            <Link
              href="/profile/created-routines"
              onClick={() => setIsProfileOpen(false)}
              className={accountLinkClass}
            >
              <ListPlus className="mr-2 size-4 text-zinc-500" />
              Created routines
            </Link>
            <Link
              href="/profile/saved-routines"
              onClick={() => setIsProfileOpen(false)}
              className={accountLinkClass}
            >
              <Bookmark className="mr-2 size-4 text-zinc-500" />
              Saved routines
            </Link>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={onSignOut}
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700"
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
