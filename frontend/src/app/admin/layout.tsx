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
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900">
      {/* Sidebar */}
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 px-8 backdrop-blur-md">
          <AdminHeader />
        </div>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
