"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthPage, { authLinkClass } from "@/components/auth/AuthPage";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type VerificationState = "loading" | "success" | "invalid" | "expired" | "error" | "idle";
type ResendState = "idle" | "loading" | "sent" | "error";

function verificationFailure(message: string): VerificationState {
  const normalized = message.toLowerCase();
  if (normalized.includes("expire")) return "expired";
  if (normalized.includes("invalid") || normalized.includes("token")) return "invalid";
  return "error";
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verified = searchParams.get("verified") === "1";
  const queryError = searchParams.get("error");
  const callbackURL = searchParams.get("callbackURL") || "/";
  const emailFromQuery = searchParams.get("email");
  const { data: session } = authClient.useSession();
  const email = session?.user?.email || emailFromQuery;
  const [state, setState] = useState<VerificationState>(
    token ? "loading" : verified ? "success" : "idle",
  );
  const [error, setError] = useState("");
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendError, setResendError] = useState("");
  const resending = useRef(false);
  const verificationRequest = useRef<{
    token: string;
    callbackURL: string;
    promise: ReturnType<typeof authClient.verifyEmail>;
  } | null>(null);
  const outcome = queryError ? verificationFailure(queryError) : state;

  useEffect(() => {
    if (!token) return;
    const currentToken = token;
    let cancelled = false;

    async function verify() {
      try {
        if (
          verificationRequest.current?.token !== currentToken ||
          verificationRequest.current.callbackURL !== callbackURL
        ) {
          verificationRequest.current = {
            token: currentToken,
            callbackURL,
            promise: authClient.verifyEmail({ query: { token: currentToken, callbackURL } }),
          };
        }
        const { error } = await verificationRequest.current.promise;
        if (cancelled) return;
        if (error) {
          setState(verificationFailure(`${error.code ?? ""} ${error.message ?? ""}`));
          setError(error.message || "We couldn’t verify your email. Please try again.");
          return;
        }
        setState("success");
      } catch {
        if (!cancelled) {
          setState("error");
          setError("We couldn’t verify your email. Check your connection or request another link.");
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, callbackURL]);

  async function handleResend() {
    if (!email || resending.current) return;
    resending.current = true;
    setResendState("loading");
    setResendError("");

    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/verify-email?verified=1`,
      });
      if (error) {
        setResendState("error");
        setResendError(error.message || "We couldn’t send another email. Please try again.");
        return;
      }
      setResendState("sent");
    } catch {
      setResendState("error");
      setResendError("We couldn’t send another email. Check your connection and try again.");
    } finally {
      resending.current = false;
    }
  }

  if (outcome === "loading") {
    return (
      <AuthPage
        title="Verifying your email"
        description="We’re checking your verification link."
      >
        <p role="status" className="text-sm text-zinc-600">
          Please wait…
        </p>
      </AuthPage>
    );
  }

  if (outcome === "success") {
    return (
      <AuthPage
        title="Email verified"
        description="Your email address is confirmed. You’re ready to continue."
      >
        <Button asChild variant="secondary" className="min-h-11 w-full">
          <Link href={session?.user?.id ? "/" : "/login"}>
            {session?.user?.id ? "Continue to Clearup" : "Continue to log in"}
          </Link>
        </Button>
      </AuthPage>
    );
  }

  const title = outcome === "expired"
    ? "This verification link has expired"
    : outcome === "invalid"
      ? "This verification link is no longer valid"
      : outcome === "error"
        ? "We couldn’t verify your email"
        : "Verify your email";
  const description = outcome === "idle"
    ? email
      ? "Open the verification link in your inbox to confirm your email address."
      : "Open the verification link from your email to continue."
    : "Request another verification email to continue.";

  return (
    <AuthPage title={title} description={description}>
      {email && (
        <p className="mb-4 break-words text-sm font-medium text-zinc-800">
          {email}
        </p>
      )}
      {outcome === "error" && (
        <p role="alert" className="mb-4 text-sm leading-relaxed text-red-700">
          {error || "The link couldn’t be verified. Try requesting another email."}
        </p>
      )}
      <p className="mb-5 text-sm leading-relaxed text-zinc-600">
        {email
          ? "If the email hasn’t arrived, check your spam or promotions folder."
          : "Log in to request another verification email if you can’t find the link."}
      </p>
      {resendState === "error" && (
        <p role="alert" className="mb-4 text-sm leading-relaxed text-red-700">
          {resendError}
        </p>
      )}
      {resendState === "sent" && (
        <p role="status" className="mb-4 text-sm text-zinc-600">
          Verification email sent. Check your inbox.
        </p>
      )}
      {email && (
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 w-full"
          onClick={handleResend}
          disabled={resendState === "loading"}
        >
          {resendState === "loading" ? "Sending email…" : "Resend verification email"}
        </Button>
      )}
      <Link href="/login" className={`${authLinkClass} mt-4 text-sm`}>
        Back to log in
      </Link>
    </AuthPage>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthPage
          title="Verify your email"
          description="Preparing your verification link…"
        >
          <p role="status" className="text-sm text-zinc-600">
            Loading…
          </p>
        </AuthPage>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
