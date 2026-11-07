"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "radix-ui";
import { Trash2 } from "lucide-react";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type AccountCheck = "loading" | "password" | "social" | "error";

export default function DeleteAccountDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountCheck, setAccountCheck] = useState<AccountCheck>("loading");
  const [accountError, setAccountError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const accountRequest = useRef(0);
  const deleting = useRef(false);

  useEffect(() => {
    if (passwordError) document.getElementById("delete-account-password")?.focus();
  }, [passwordError]);

  async function checkAccounts() {
    const request = ++accountRequest.current;
    setAccountCheck("loading");
    setAccountError("");

    try {
      const { data, error } = await authClient.listAccounts();
      if (request !== accountRequest.current) return;
      if (error || !data?.length) {
        setAccountCheck("error");
        setAccountError("Couldn’t check your sign-in method. Please try again.");
        return;
      }
      const hasPassword = data.some((account) => account.providerId === "credential");
      setAccountCheck(hasPassword ? "password" : "social");
    } catch {
      if (request !== accountRequest.current) return;
      setAccountCheck("error");
      setAccountError("Couldn’t check your sign-in method. Check your connection and try again.");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (deleting.current) return;
    setOpen(nextOpen);
    setPassword("");
    setPasswordError("");
    setError("");
    setNotice("");
    setRequiresLogin(false);

    if (nextOpen) {
      void checkAccounts();
    } else {
      accountRequest.current += 1;
    }
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (
      deleting.current ||
      requiresLogin ||
      notice ||
      (accountCheck !== "password" && accountCheck !== "social") ||
      (accountCheck === "password" && !password)
    ) return;

    deleting.current = true;
    setIsDeleting(true);
    setPasswordError("");
    setError("");

    try {
      const { data, error } = await authClient.deleteUser({
        callbackURL: `${window.location.origin}/`,
        ...(accountCheck === "password" ? { password } : {}),
      });

      if (error) {
        if (error.code === "INVALID_PASSWORD") {
          setPasswordError("That password doesn’t match your account. Try again.");
        } else if (
          error.code === "SESSION_EXPIRED" ||
          error.code === "SESSION_NOT_FRESH" ||
          error.code === "UNAUTHORIZED"
        ) {
          setRequiresLogin(true);
          setError("Log out and log in again to confirm account deletion. Then return to Preferences.");
        } else {
          setError(error.message || "Couldn’t delete your account. Please try again.");
        }
        return;
      }

      if (data?.success && data.message === "User deleted") {
        router.replace("/");
        router.refresh();
      } else if (data?.success && data.message === "Verification email sent") {
        setPassword("");
        setNotice("Check your inbox for a link to confirm account deletion.");
      } else {
        setError("Couldn’t confirm account deletion. Refresh the page before trying again.");
      }
    } catch {
      setError("Couldn’t delete your account. Check your connection and try again.");
    } finally {
      deleting.current = false;
      setIsDeleting(false);
    }
  }

  const canDelete =
    !isDeleting &&
    !requiresLogin &&
    !notice &&
    (accountCheck === "social" || (accountCheck === "password" && password.length > 0));

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 border-red-200 bg-white text-red-700 hover:bg-red-50"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete account
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (deleting.current) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (deleting.current) event.preventDefault();
          }}
        >
          <Dialog.Title className="text-xl font-semibold tracking-tight text-zinc-900">
            Delete your account?
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-zinc-600">
            Deleting your Clearup account is permanent. You’ll lose access to this
            account and the routines you manage with it.
          </Dialog.Description>

          <form onSubmit={handleDelete} className="mt-6" aria-busy={isDeleting}>
            {accountCheck === "loading" && (
              <p role="status" className="text-sm text-zinc-600">
                Checking your sign-in method…
              </p>
            )}
            {accountCheck === "error" && (
              <div>
                <p role="alert" className="text-sm leading-relaxed text-red-700">
                  {accountError}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-11 border-zinc-300 bg-white"
                  onClick={() => void checkAccounts()}
                >
                  Try again
                </Button>
              </div>
            )}
            {accountCheck === "password" && !notice && (
              <fieldset disabled={isDeleting} className="min-w-0">
                <label
                  htmlFor="delete-account-password"
                  className="mb-2 block text-sm font-medium text-zinc-700"
                >
                  Current password
                </label>
                <PasswordInput
                  id="delete-account-password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setPasswordError("");
                  }}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "delete-account-password-error" : undefined}
                  required
                />
                {passwordError && (
                  <p id="delete-account-password-error" role="alert" className="mt-2 text-sm text-red-700">
                    {passwordError}
                  </p>
                )}
              </fieldset>
            )}
            {accountCheck === "social" && !notice && (
              <p className="text-sm leading-relaxed text-zinc-600">
                You use a connected account to sign in, so no password is needed.
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 text-sm leading-relaxed text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm leading-relaxed text-zinc-600">
                {notice}
              </p>
            )}
            {isDeleting && <p role="status" className="sr-only">Deleting your account…</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button
                  ref={cancelRef}
                  type="button"
                  variant="outline"
                  className="min-h-11 border-zinc-300 bg-white"
                  disabled={isDeleting}
                >
                  {notice ? "Close" : "Cancel"}
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                variant="destructive"
                className="min-h-11 border-red-700! bg-red-700! text-white! hover:border-red-800! hover:bg-red-800!"
                disabled={!canDelete}
              >
                {isDeleting ? "Deleting…" : "Delete account"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
