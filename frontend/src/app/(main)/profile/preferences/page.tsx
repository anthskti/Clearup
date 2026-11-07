"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import DeleteAccountDialog from "@/components/auth/DeleteAccountDialog";
import ProfilePhotoEditor from "@/components/auth/ProfilePhotoEditor";
import BrandedLoadingScreen from "@/components/BrandedLoadingScreen";
import ProceduralWave from "@/components/themes/ProceduralWave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { AuthSessionUnavailable } from "@/components/AuthSessionUnavailable";
import { getSessionRetryAt, isTemporaryAuthError } from "@/lib/auth-retry";

const emptySubscribe = () => () => {};

export default function PreferencesPage() {
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const router = useRouter();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const sessionName = session?.user?.name || "";
  const [username, setUsername] = useState(sessionName);
  const [previousName, setPreviousName] = useState(sessionName);
  const [sessionChecked, setSessionChecked] = useState(!isPending);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileStatus, setProfileStatus] = useState("");
  const savingName = useRef(false);

  useEffect(() => {
    if (!isPending && (sessionError?.status === 401 || (!session && !sessionError))) router.push("/login");
  }, [isPending, sessionError, session, router]);

  if (sessionName !== previousName) {
    setPreviousName(sessionName);
    setUsername(sessionName);
  }
  // Keep draft changes mounted while Better Auth refreshes the session.
  if (!isPending && !sessionChecked) setSessionChecked(true);

  async function handleUpdateProfile(event: React.FormEvent) {
    event.preventDefault();
    const name = username.trim();
    if (!name || savingName.current) return;
    savingName.current = true;
    setIsSaving(true);
    setProfileError("");
    setProfileStatus("");

    try {
      const { error } = await authClient.updateUser({ name });
      if (error) {
        setProfileError(error.message || "Could not save your display name. Please try again.");
        return;
      }
      setUsername(name);
      setProfileStatus("Display name updated.");
    } catch {
      setProfileError("Could not save your display name. Check your connection and try again.");
    } finally {
      savingName.current = false;
      setIsSaving(false);
    }
  }

  if (!mounted || (isPending && !sessionChecked)) {
    return (
      <BrandedLoadingScreen
        title="Loading session"
        subtitle="Checking your preferences."
      />
    );
  }
  if (sessionError && isTemporaryAuthError(sessionError)) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-24 pb-12 sm:px-6">
        <AuthSessionUnavailable
          retryAt={getSessionRetryAt()}
          onRetry={refetch}
        />
      </div>
    );
  }
  if (sessionError?.status === 403) {
    return <div className="p-10 text-center">Your account cannot access this page.</div>;
  }
  if (!session) return null;

  const nameChanged = username.trim() !== sessionName;

  return (
    <div className="relative min-h-screen bg-[#F8F8F8]">
      <ProceduralWave
        seed={7}
        height={160}
        gradientFrom="#e9f6ff"
        gradientTo="#f0f8fc"
        flip
      />
      <div className="relative z-1 mx-auto max-w-3xl px-4 pt-34 pb-20 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Preferences
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Manage how you appear across Clearup and your account information.
          </p>
        </header>

        <section aria-labelledby="profile-title">
          <h2 id="profile-title" className="mb-3 text-lg font-semibold text-zinc-900">
            Profile
          </h2>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="p-5 sm:p-6">
              <ProfilePhotoEditor image={session.user.image ?? null} />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium text-zinc-900">Email</h3>
                <span className="text-xs text-zinc-500">
                  {session.user.emailVerified ? "Verified" : "Not verified"}
                </span>
              </div>
              <p className="mt-2 break-words text-sm text-zinc-700">{session.user.email}</p>
              <p className="mt-1 text-sm text-zinc-500">The email associated with your account.</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-5 sm:p-6" aria-busy={isSaving}>
              <label htmlFor="display-name" className="block text-sm font-medium text-zinc-900">
                Display name
              </label>
              <p id="display-name-help" className="mt-1 text-sm text-zinc-500">
                Shown alongside your community routines.
              </p>
              <Input
                id="display-name"
                name="name"
                autoComplete="nickname"
                aria-describedby="display-name-help"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setProfileError("");
                  setProfileStatus("");
                }}
                disabled={isSaving}
                className="mt-3 min-h-11 border-zinc-300 text-base md:text-base"
                required
              />
              <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  {profileError && <p role="alert" className="text-red-700">{profileError}</p>}
                  <p role="status" className="text-zinc-600">{profileStatus}</p>
                </div>
                <Button
                  type="submit"
                  variant="secondary"
                  className="min-h-11"
                  disabled={isSaving || !username.trim() || !nameChanged}
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section aria-labelledby="delete-account-title" className="mt-10">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 id="delete-account-title" className="text-base font-semibold text-zinc-900">
                Delete account
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Permanently delete your Clearup account. This cannot be undone.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </section>
      </div>
    </div>
  );
}
