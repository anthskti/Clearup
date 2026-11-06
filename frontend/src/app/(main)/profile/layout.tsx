import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthForbiddenError, AuthUnavailableError, getSession } from "@/lib/auth";
import { Metadata } from "next";
import { AuthUnavailable } from "@/components/AuthUnavailable";

export const metadata: Metadata = {
  title: "Profile | Clearup",
  description: "Your profile.",
};

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieString = headersList.get("cookie") || "";

  try {
    const session = await getSession(cookieString);
    if (!session?.user?.id) redirect("/login");
  } catch (error) {
    if (error instanceof AuthUnavailableError) return <AuthUnavailable retryAt={error.retryAt} />;
    if (error instanceof AuthForbiddenError) {
      return (
        <main className="mx-auto flex min-h-[50vh] max-w-lg items-center justify-center px-6 text-center">
          <p className="text-sm text-zinc-600">
            Your account cannot access this page.
          </p>
        </main>
      );
    }
    throw error;
  }

  return <>{children}</>;
}
