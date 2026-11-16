import { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  AuthForbiddenError,
  AuthUnavailableError,
  getEffectiveUser,
} from "@/lib/auth";
import { AuthUnavailable } from "@/components/AuthUnavailable";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieString = (await headers()).get("cookie") || "";
  let effectiveUser;
  try {
    effectiveUser = await getEffectiveUser(cookieString);
  } catch (error) {
    if (error instanceof AuthUnavailableError) {
      return <AuthUnavailable retryAt={error.retryAt} />;
    }
    if (error instanceof AuthForbiddenError) redirect("/");
    throw error;
  }

  if (!effectiveUser) {
    redirect("/login");
  }
  if (effectiveUser.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh w-full bg-zinc-50 text-zinc-900">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-zinc-50">
        <header className="sticky top-0 z-30 flex min-h-16 shrink-0 items-center border-b border-zinc-200 bg-white px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8">
          <AdminHeader />
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto min-w-0 max-w-6xl overflow-x-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
