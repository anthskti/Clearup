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
import PasswordRequirements, {
  passwordMeetsRequirements,
} from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const submitting = useRef(false);
  const passwordReady = passwordMeetsRequirements(password);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || created || !passwordMeetsRequirements(password)) return;
    submitting.current = true;
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
        callbackURL: `${window.location.origin}/verify-email?verified=1`,
      });
      if (error) {
        setError(error.message || "We couldn’t create your account. Please try again.");
        return;
      }
      setCreated(true);
      router.replace(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError("We couldn’t create your account. Check your connection and try again.");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthPage
      title="Create your account"
      description="Build, save, and share your skincare routines."
    >
      <form
        onSubmit={handleRegister}
        className="space-y-5"
        aria-busy={loading}
      >
        <div>
          <label htmlFor="register-name" className={authLabelClass}>
            Display name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={authInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="register-email" className={authLabelClass}>
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className={authLabelClass}>
            Password
          </label>
          <PasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            aria-describedby="register-password-help"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <PasswordRequirements password={password} id="register-password-help" />
        </div>
        {error && (
          <p role="alert" className="text-sm leading-relaxed text-red-700">
            {error}
          </p>
        )}
        {created && (
          <p role="status" className="text-sm text-zinc-600">
            Account created. Opening email verification…
          </p>
        )}
        <Button
          type="submit"
          variant="secondary"
          className="min-h-11 w-full"
          disabled={loading || created || !passwordReady}
        >
          {loading || created ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-5 text-sm text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className={authLinkClass}>
          Log in
        </Link>
      </p>
    </AuthPage>
  );
}
