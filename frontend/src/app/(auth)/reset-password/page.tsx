"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPage, {
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/AuthPage";
import PasswordRequirements, {
  passwordMeetsRequirements,
} from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type UiState = "idle" | "loading" | "success" | "invalid" | "expired";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const linkError = searchParams.get("error")?.toUpperCase();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<UiState>("idle");
  const [error, setError] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const submitting = useRef(false);
  const passwordReady =
    passwordMeetsRequirements(password) && password === confirm && confirm.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !token) return;
    if (!passwordMeetsRequirements(password)) return;
    if (password !== confirm) {
      setMismatch(true);
      document.getElementById("confirm-password")?.focus();
      return;
    }
    submitting.current = true;
    setMismatch(false);
    setError("");
    setState("loading");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (error) {
        const message = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
        if (message.includes("expired") || message.includes("expire")) {
          setState("expired");
        } else if (message.includes("token")) {
          setState("invalid");
        } else {
          setState("idle");
          setError(error.message || "We couldn’t update your password. Please try again.");
        }
        return;
      }
      setState("success");
    } catch {
      setState("idle");
      setError("We couldn’t update your password. Check your connection and try again.");
    } finally {
      submitting.current = false;
    }
  }

  const expiredLink = state === "expired" || linkError === "TOKEN_EXPIRED";
  const invalidLink = state === "invalid" || linkError === "INVALID_TOKEN";

  if (!token || invalidLink || expiredLink) {
    const title = expiredLink
      ? "This reset link has expired"
      : invalidLink
        ? "This reset link is no longer valid"
        : "Open your reset link";

    return (
      <AuthPage
        title={title}
        description="Use the link from your password reset email, or request a new one to continue."
      >
        <Button asChild variant="secondary" className="min-h-11 w-full">
          <Link href="/forgot-password">
            Request a new link
          </Link>
        </Button>
        <Link href="/login" className={`${authLinkClass} mt-4 text-sm`}>
          Back to log in
        </Link>
      </AuthPage>
    );
  }

  if (state === "success") {
    return (
      <AuthPage
        title="Password updated"
        description="You can now log in with your new password."
      >
        <Button asChild variant="secondary" className="min-h-11 w-full">
          <Link href="/login">
            Log in
          </Link>
        </Button>
      </AuthPage>
    );
  }

  return (
    <AuthPage
      title="Choose a new password"
      description="Update your password to get back to your routines."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={state === "loading"}
      >
        <div>
          <label htmlFor="new-password" className={authLabelClass}>
            New password
          </label>
          <input
            id="new-password"
            name="password"
            type="text"
            autoComplete="new-password"
            aria-describedby="new-password-help"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setMismatch(false);
            }}
            className={authInputClass}
            required
          />
          <PasswordRequirements password={password} id="new-password-help" />
        </div>
        <div>
          <label htmlFor="confirm-password" className={authLabelClass}>
            Confirm new password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="text"
            autoComplete="new-password"
            aria-invalid={mismatch}
            aria-describedby={mismatch ? "password-mismatch" : undefined}
            maxLength={128}
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              setMismatch(false);
            }}
            className={authInputClass}
            required
          />
          {mismatch && (
            <p id="password-mismatch" role="alert" className="mt-2 text-sm text-red-700">
              Passwords do not match.
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm leading-relaxed text-red-700">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={state === "loading" || !passwordReady}
        >
          {state === "loading" ? "Updating password…" : "Update password"}
        </Button>
      </form>
      <Link href="/login" className={`${authLinkClass} mt-4 text-sm`}>
        Back to log in
      </Link>
    </AuthPage>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense
      fallback={
        <AuthPage
          title="Reset your password"
          description="Preparing your reset link…"
        >
          <p role="status" className="text-sm text-zinc-600">
            Loading…
          </p>
        </AuthPage>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
