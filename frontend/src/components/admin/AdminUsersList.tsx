"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { getRoutinesByUserId } from "@/lib/routines";
import { moderateUser } from "@/lib/admin-users";
import type { AdminUserRow } from "@/types/admin";
import type { RoutineWithProducts } from "@/types/routine";

function formatUtc(value: string, includeSeconds = false) {
  const iso = new Date(value).toISOString();
  return `${iso.slice(0, includeSeconds ? 19 : 16).replace("T", " ")} UTC`;
}

function UserStatus({ user }: { user: AdminUserRow }) {
  const accountLabel = user.accountStatus === "active"
    ? "Active"
    : user.accountStatus === "suspended" ? "Suspended" : "Banned";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          user.role === "admin"
            ? "bg-violet-100 text-violet-800"
            : "bg-zinc-100 text-zinc-700"
        }`}
      >
        {user.role}
      </span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        user.accountStatus === "active" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
      }`}>
        {accountLabel}
      </span>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
          user.emailVerified
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-800"
        }`}
      >
        {user.emailVerified ? "Verified" : "Unverified"}
      </span>
    </div>
  );
}

export default function AdminUsersList({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [routines, setRoutines] = useState<RoutineWithProducts[] | null>(null);
  const [routineError, setRoutineError] = useState("");
  const [retry, setRetry] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");
  const [moderationReason, setModerationReason] = useState("");
  const [durationDays, setDurationDays] = useState<1 | 7 | 30>(7);
  const [moderationPending, setModerationPending] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selectedUser) return;

    let active = true;
    getRoutinesByUserId(selectedUser.id)
      .then((data) => {
        if (active) setRoutines(data);
      })
      .catch(() => {
        if (active) setRoutineError("Could not load this user’s routines.");
      });

    return () => {
      active = false;
    };
  }, [selectedUser, retry]);

  async function copyUserId() {
    if (!selectedUser) return;
    try {
      await navigator.clipboard.writeText(selectedUser.id);
      setCopyMessage("User ID copied.");
    } catch {
      setCopyMessage("Could not copy user ID.");
    }
  }

  function openDetails(user: AdminUserRow, button: HTMLButtonElement) {
    openerRef.current = button;
    setRoutines(null);
    setRoutineError("");
    setCopyMessage("");
    setModerationError("");
    setModerationReason("");
    setSelectedUser(user);
  }

  async function applyModeration(action: "suspend" | "ban" | "restore") {
    if (!selectedUser || moderationPending) return;
    const targetId = selectedUser.id;
    const reason = moderationReason.trim();
    if (action !== "restore" && (!reason || reason.length > 255)) {
      setModerationError("Enter a reason of 1 to 255 characters.");
      return;
    }
    const prompt = action === "restore"
      ? `Restore ${selectedUser.email}'s account?`
      : action === "ban"
        ? `Permanently ban ${selectedUser.email}?`
        : `Suspend ${selectedUser.email} for ${durationDays} days?`;
    if (!window.confirm(prompt)) return;
    setModerationPending(true);
    setModerationError("");
    try {
      const result = await moderateUser(targetId, action === "restore"
        ? { action }
        : action === "ban"
          ? { action, reason }
          : { action, durationDays, reason });
      setSelectedUser((current) => current?.id === targetId ? { ...current, ...result } : current);
      if (selectedUser.id === targetId) setModerationReason("");
      router.refresh();
    } catch (error) {
      setModerationError(error instanceof Error ? error.message : "Could not update this account.");
    } finally {
      setModerationPending(false);
    }
  }

  return (
    <>
      {users.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white px-5 py-12 text-center">
          <h2 className="text-base font-semibold text-zinc-900">No users found</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Try changing the search or filters.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden" aria-label="Users">
            {users.map((user) => (
              <li
                key={user.id}
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words font-semibold text-zinc-950">
                      {user.name}
                    </h2>
                    <p className="mt-1 break-all text-sm text-zinc-600">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => openDetails(user, event.currentTarget)}
                    disabled={moderationPending}
                    className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Details
                  </button>
                </div>
                <div className="mt-3">
                  <UserStatus user={user} />
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-y-1 text-sm">
                  <dt className="text-zinc-500">Joined</dt>
                  <dd className="mb-2 min-w-0 break-words text-zinc-800">
                    <time dateTime={user.createdAt}>{formatUtc(user.createdAt)}</time>
                  </dd>
                  <dt className="text-zinc-500">Routines</dt>
                  <dd className="font-medium tabular-nums text-zinc-900">
                    {user.routineCount}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm lg:block">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <th scope="col" className="px-4 py-3">Name and email</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Account</th>
                  <th scope="col" className="px-4 py-3">Verification</th>
                  <th scope="col" className="px-4 py-3 text-right">Routines</th>
                  <th scope="col" className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70">
                    <td className="max-w-72 px-4 py-3">
                      <div className="break-words font-medium text-zinc-900">{user.name}</div>
                      <div className="break-all text-xs text-zinc-600">{user.email}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-600">
                      <time dateTime={user.createdAt}>{formatUtc(user.createdAt)}</time>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.accountStatus === "active" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                      }`}>
                        {user.accountStatus === "active" ? "Active" : user.accountStatus === "suspended" ? "Suspended" : "Banned"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-zinc-900">{user.routineCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => openDetails(user, event.currentTarget)}
                        disabled={moderationPending}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog.Root
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open && !moderationPending) {
            setSelectedUser(null);
            setCopyMessage("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-zinc-950/40" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              openerRef.current?.focus();
              openerRef.current = null;
            }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[min(88dvh,48rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl outline-none animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none sm:p-6"
          >
            {selectedUser && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Dialog.Title className="break-words text-xl font-semibold tracking-tight text-zinc-950">
                      {selectedUser.name}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 break-all text-sm text-zinc-600">
                      {selectedUser.email}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Close user details"
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <X className="size-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <section className="mt-6" aria-label="Account details">
                  <dl className="grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-[minmax(7rem,auto)_1fr] sm:gap-x-4 sm:gap-y-3">
                    <dt className="text-zinc-500">User ID</dt>
                    <dd className="mb-3 min-w-0 sm:mb-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <code className="break-all text-xs text-zinc-800">{selectedUser.id}</code>
                        <button
                          type="button"
                          onClick={copyUserId}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          {copyMessage === "User ID copied." ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <Copy className="size-4" aria-hidden="true" />
                          )}
                          {copyMessage === "User ID copied." ? "Copied" : "Copy ID"}
                        </button>
                      </div>
                      {copyMessage && (
                        <p className={`mt-1 text-xs ${copyMessage.includes("Could not") ? "text-red-700" : "text-emerald-700"}`} role="status">
                          {copyMessage}
                        </p>
                      )}
                    </dd>
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="mb-3 break-words text-zinc-900 sm:mb-0">
                      <time dateTime={selectedUser.createdAt}>
                        {formatUtc(selectedUser.createdAt, true)}
                      </time>
                    </dd>
                    <dt className="text-zinc-500">Role</dt>
                    <dd className="mb-3 text-zinc-900 sm:mb-0">{selectedUser.role}</dd>
                    <dt className="text-zinc-500">Email</dt>
                    <dd className="mb-3 text-zinc-900 sm:mb-0">
                      {selectedUser.emailVerified ? "Verified" : "Not verified"}
                    </dd>
                    <dt className="text-zinc-500">Routines</dt>
                    <dd className="tabular-nums text-zinc-900">{selectedUser.routineCount}</dd>
                  </dl>
                </section>

                <section className="mt-6 border-t border-zinc-200 pt-5" aria-labelledby="user-moderation-heading">
                  <h3 id="user-moderation-heading" className="font-semibold text-zinc-900">Account restriction</h3>
                  <p className="mt-2 text-sm text-zinc-700">
                    Status: <span className="font-medium capitalize">{selectedUser.accountStatus}</span>
                  </p>
                  {selectedUser.accountStatus !== "active" && (
                    <dl className="mt-2 grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-[7rem_1fr] sm:gap-x-3">
                      <dt className="text-zinc-500">Reason</dt>
                      <dd className="break-words text-zinc-800">{selectedUser.banReason || "No reason recorded"}</dd>
                      {selectedUser.banExpires && <>
                        <dt className="text-zinc-500">Expires</dt>
                        <dd className="text-zinc-800"><time dateTime={selectedUser.banExpires}>{formatUtc(selectedUser.banExpires)}</time></dd>
                      </>}
                    </dl>
                  )}
                  {selectedUser.role === "admin" ? (
                    <p className="mt-3 text-sm text-zinc-600">Administrator accounts cannot be moderated here.</p>
                  ) : <div className="mt-3 space-y-3">
                    <label className="block text-sm font-medium text-zinc-800">
                      Reason
                      <input
                        value={moderationReason}
                        onChange={(event) => setModerationReason(event.target.value)}
                        maxLength={255}
                        disabled={moderationPending}
                        className="mt-1.5 min-h-11 w-full rounded-lg border border-zinc-300 px-3 text-base font-normal text-zinc-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                        placeholder="Required for suspension or ban"
                      />
                    </label>
                    <div className="flex flex-col items-start gap-3">
                      <fieldset disabled={moderationPending} className="min-w-0 disabled:opacity-50">
                        <legend className="mb-1.5 text-xs font-medium tracking-wide text-zinc-600">Suspension duration</legend>
                        <div className="inline-flex rounded-2xl bg-zinc-100 p-0.5 ring-1 ring-inset ring-zinc-900/5 contrast-more:ring-zinc-400">
                          {([1, 7, 30] as const).map((days) => (
                            <label
                              key={days}
                              className="group relative flex min-h-11 min-w-11 cursor-pointer touch-manipulation select-none items-center justify-center rounded-xl px-0.5"
                            >
                              <input
                                type="radio"
                                name="suspension-duration"
                                value={days}
                                checked={durationDays === days}
                                onChange={() => setDurationDays(days)}
                                className="peer sr-only"
                              />
                              <span
                                className={`flex min-h-8 items-center justify-center rounded-lg px-3 text-sm font-medium tabular-nums transition-colors duration-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0e4a84] motion-reduce:transition-none ${
                                  durationDays === days
                                    ? "bg-white text-[#0e4a84] shadow-[0_1px_3px_rgb(0_0_0/0.08)] contrast-more:ring-1 contrast-more:ring-zinc-500"
                                    : "text-zinc-600 group-hover:bg-white/70 group-active:bg-zinc-200"
                                }`}
                              >
                                {days} {days === 1 ? "day" : "days"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" disabled={moderationPending} onClick={() => applyModeration("suspend")} className="inline-flex min-h-11 touch-manipulation select-none items-center rounded-xl bg-amber-50 px-4 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-900/10 transition-colors duration-100 hover:bg-amber-100 active:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none">Suspend</button>
                        <button type="button" disabled={moderationPending} onClick={() => applyModeration("ban")} className="inline-flex min-h-11 touch-manipulation select-none items-center rounded-xl bg-red-50 px-4 text-sm font-medium text-red-800 ring-1 ring-inset ring-red-900/10 transition-colors duration-100 hover:bg-red-100 active:bg-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none">Ban permanently</button>
                        {selectedUser.accountStatus !== "active" && <button type="button" disabled={moderationPending} onClick={() => applyModeration("restore")} className="inline-flex min-h-11 touch-manipulation select-none items-center rounded-xl bg-zinc-50 px-4 text-sm font-medium text-zinc-800 ring-1 ring-inset ring-zinc-900/10 transition-colors duration-100 hover:bg-zinc-100 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-700 disabled:cursor-wait disabled:opacity-50 motion-reduce:transition-none">Restore account</button>}
                      </div>
                    </div>
                    {moderationPending && <p className="text-sm text-zinc-600" role="status">Updating account…</p>}
                    {moderationError && <p className="text-sm text-red-700" role="alert">{moderationError}</p>}
                  </div>}
                </section>

                <section className="mt-6 border-t border-zinc-200 pt-5" aria-labelledby="user-routines-heading">
                  <h3 id="user-routines-heading" className="font-semibold text-zinc-900">Routines</h3>
                  {routineError ? (
                    <div className="mt-3">
                      <p className="text-sm text-red-700" role="alert">{routineError}</p>
                      <button
                        type="button"
                        onClick={() => setRetry((value) => value + 1)}
                        className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      >
                        Retry
                      </button>
                    </div>
                  ) : routines === null ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-zinc-600" role="status">
                      <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Loading routines…
                    </p>
                  ) : routines.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-600">This user has not created any routines.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                      {routines.map((routine) => (
                        <li key={routine.id}>
                          <Link
                            href={`/routine/${routine.id}`}
                            className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-brand hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                          >
                            <span className="break-words">{routine.name}</span>
                            <span className="shrink-0 text-xs text-zinc-500">#{routine.id}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
