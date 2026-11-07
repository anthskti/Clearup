"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import AuthPage, {
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/AuthPage";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type UiState = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<UiState>("idle");
  const [error, setError] = useState("");
  const submitting = useRef(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setState("loading");
    setError("");

    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setState("error");
        setError(error.message || "We couldn’t send the reset link. Please try again.");
        return;
      }
      setState("success");
    } catch {
      setState("error");
      setError("We couldn’t send the reset link. Check your connection and try again.");
    } finally {
      submitting.current = false;
    }
  }

  if (state === "success") {
    return (
      <AuthPage
        title="Check your inbox"
        description="If an account exists for that email, you’ll receive a password reset link."
      >
        <p role="status" className="text-sm leading-relaxed text-zinc-600">
          Check your spam folder too. Open the link in the email to choose a new password.
        </p>
        <Button asChild variant="secondary" className="mt-6 min-h-11 w-full">
          <Link href="/login">
            Back to log in
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => setState("idle")}
          className={`${authLinkClass} mt-3 text-sm`}
        >
          Use a different email
        </button>
      </AuthPage>
    );
  }

  return (
    <AuthPage
      title="Forgot your password?"
      description="Enter your email to request a password reset link."
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        aria-busy={state === "loading"}
      >
        <div>
          <label htmlFor="reset-email" className={authLabelClass}>
            Email
          </label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
            required
          />
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
          disabled={state === "loading"}
        >
          {state === "loading" ? "Sending link…" : "Send reset link"}
        </Button>
      </form>
      <Link href="/login" className={`${authLinkClass} mt-4 text-sm`}>
        Back to log in
      </Link>
    </AuthPage>
  );
}
