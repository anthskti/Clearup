import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import AdminUsersList from "@/components/admin/AdminUsersList";
import { getAdminUsersServer } from "@/lib/admin-server";

const PAGE_SIZE = 25;

type SearchParams = {
  page?: string | string[];
  search?: string | string[];
  role?: string | string[];
  verified?: string | string[];
  status?: string | string[];
};

type Props = { searchParams: Promise<SearchParams> };

function oneValue(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function pageNumber(value: string): number {
  if (!/^\d+$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 400_000
    ? parsed
    : 1;
}

function paginationHref(page: number, search: string, role: string, verified: string, status: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (verified) params.set("verified", verified);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return `/admin/users?${params.toString()}`;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = oneValue(sp.search).trim();
  const roleValue = oneValue(sp.role);
  const role = roleValue === "admin" || roleValue === "user" ? roleValue : "";
  const verifiedValue = oneValue(sp.verified);
  const verified = verifiedValue === "true" || verifiedValue === "false"
    ? verifiedValue
    : "";
  const statusValue = oneValue(sp.status);
  const status = ["active", "suspended", "banned"].includes(statusValue) ? statusValue as "active" | "suspended" | "banned" : "";
  const requestedPage = pageNumber(oneValue(sp.page));
  const offset = (requestedPage - 1) * PAGE_SIZE;

  let userPayload;
  try {
    userPayload = await getAdminUsersServer({
      limit: PAGE_SIZE,
      offset,
      search,
      role: role ? role as "user" | "admin" : undefined,
      verified: verified ? verified === "true" : undefined,
      status: status || undefined,
    });
  } catch (error: unknown) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900" role="alert">
        {error instanceof Error ? error.message : "Could not load users."}
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(userPayload.total / PAGE_SIZE));
  if (requestedPage > totalPages) {
    redirect(paginationHref(totalPages, search, role, verified, status));
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-zinc-600">
          Search accounts and review their routines and account status.
        </p>
      </header>

      <form
        method="get"
        className="grid min-w-0 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_10rem_11rem_11rem_auto] xl:items-end"
      >
        <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-sm font-medium text-zinc-800">Search users</span>
          <span className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
            <Search className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
            <input
              type="search"
              name="search"
              defaultValue={search}
              maxLength={100}
              placeholder="ID, name, or email"
              className="min-w-0 flex-1 border-0 bg-transparent text-base text-zinc-950 outline-none placeholder:text-zinc-500"
            />
          </span>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm font-medium text-zinc-800">Account status</span>
          <span className="relative block">
            <select name="status" defaultValue={status} className="min-h-11 w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-10 text-base text-zinc-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
          </span>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm font-medium text-zinc-800">Role</span>
          <span className="relative block">
            <select
              name="role"
              defaultValue={role}
              className="min-h-11 w-full min-w-0 max-w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-10 text-base text-zinc-900 transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
          </span>
        </label>
        <label className="block min-w-0">
          <span className="mb-1.5 block text-sm font-medium text-zinc-800">Email verification</span>
          <span className="relative block">
            <select
              name="verified"
              defaultValue={verified}
              className="min-h-11 w-full min-w-0 max-w-full appearance-none rounded-lg border border-zinc-300 bg-white py-2 pl-3 pr-10 text-base text-zinc-900 transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
            >
              <option value="">All accounts</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
              aria-hidden="true"
            />
          </span>
        </label>
        <div className="flex min-w-0 flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:flex-none"
          >
            Search
          </button>
          {(search || role || verified || status) && (
            <Link
              href="/admin/users"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600" aria-live="polite">
          {userPayload.total.toLocaleString()} {userPayload.total === 1 ? "account" : "accounts"}
          {search ? <> matching <span className="font-medium text-zinc-900">“{search}”</span></> : null}
          <span className="block text-xs text-zinc-500 sm:inline sm:before:content-['·'] sm:before:px-2">
            Page {requestedPage} of {totalPages}
          </span>
        </p>
        <Pagination
          page={requestedPage}
          totalPages={totalPages}
          search={search}
          role={role}
          verified={verified}
          status={status}
        />
      </div>

      <AdminUsersList users={userPayload.users} />

      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            page={requestedPage}
            totalPages={totalPages}
            search={search}
            role={role}
            verified={verified}
          status={status}
          />
        </div>
      )}
    </div>
  );
}
function Pagination({
  page,
  totalPages,
  search,
  role,
  verified,
  status,
}: {
  page: number;
  totalPages: number;
  search: string;
  role: string;
  verified: string;
  status: string;
}) {
  return (
    <nav aria-label="User pages" className="inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-2xl bg-zinc-100 p-1 ring-1 ring-inset ring-zinc-900/5 contrast-more:ring-zinc-400">
      {page > 1 ? (
        <Link
          href={paginationHref(page - 1, search, role, verified, status)}
          rel="prev"
          className="inline-flex min-h-11 touch-manipulation select-none items-center rounded-xl bg-white px-4 text-sm font-medium text-[#0e4a84] shadow-[0_1px_3px_rgb(0_0_0/0.08)] transition-colors duration-100 hover:bg-white/70 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] motion-reduce:transition-none"
        >
          Previous
        </Link>
      ) : (
        <span className="inline-flex min-h-11 select-none items-center rounded-xl px-4 text-sm text-zinc-400">Previous</span>
      )}
      {page < totalPages ? (
        <Link
          href={paginationHref(page + 1, search, role, verified, status)}
          rel="next"
          className="inline-flex min-h-11 touch-manipulation select-none items-center rounded-xl bg-white px-4 text-sm font-medium text-[#0e4a84] shadow-[0_1px_3px_rgb(0_0_0/0.08)] transition-colors duration-100 hover:bg-white/70 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e4a84] motion-reduce:transition-none"
        >
          Next
        </Link>
      ) : (
        <span className="inline-flex min-h-11 select-none items-center rounded-xl px-4 text-sm text-zinc-400">Next</span>
      )}
    </nav>
  );
}
