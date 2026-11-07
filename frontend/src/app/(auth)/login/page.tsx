"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthPage, {
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/AuthPage";
import PasswordInput from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const submitting = useRef(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending("email");
    setError("");
    setGoogleError("");
    setNeedsVerification(false);

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(error.message || "We couldn’t log you in. Please try again.");
        setNeedsVerification(error.code === "EMAIL_NOT_VERIFIED");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("We couldn’t log you in. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  async function handleGoogleSignIn() {
    if (submitting.current) return;
    submitting.current = true;
    setPending("google");
    setGoogleError("");
    setError("");
    setNeedsVerification(false);

    try {
      const { data, error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `${window.location.origin}/`,
        errorCallbackURL: `${window.location.origin}/login`,
      });
      if (error || !data?.url) {
        setGoogleError(error?.message || "Google sign-in couldn’t start. Please try again.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setGoogleError("Google sign-in couldn’t start. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setPending(null);
    }
  }

  return (
    <AuthPage
      title="Log in to Clearup"
      description="Pick up where you left off with your skincare routines."
    >
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full border-zinc-300 bg-white hover:bg-zinc-50"
        onClick={handleGoogleSignIn}
        disabled={pending !== null}
      >
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {pending === "google" ? "Connecting to Google…" : "Continue with Google"}
      </Button>
      {googleError && (
        <p role="alert" className="mt-3 text-sm leading-relaxed text-red-700">
          {googleError}
        </p>
      )}

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <div className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs text-zinc-500">or use email</span>
        <div className="h-px flex-1 bg-zinc-200" />
      </div>

      <form

        onSubmit={handleLogin}

        className="space-y-5"

        aria-busy={pending === "email"}

      >
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Email
          </label>
          <input
            id="login-email"
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
        <div>
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="login-password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <Link href="/forgot-password" className={`${authLinkClass} text-sm`}>
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm leading-relaxed text-red-700">
            {error}
          </p>
        )}
        {needsVerification && (
          <Link
            href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
            className={`${authLinkClass} text-sm`}
          >
            Verify your email
          </Link>
        )}
        <Button
          type="submit"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={pending !== null}
        >
          {pending === "email" ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-zinc-600">
        New to Clearup?{" "}
        <Link href="/register" className={authLinkClass}>
          Create an account
        </Link>
      </p>
    </AuthPage>
  );
}
