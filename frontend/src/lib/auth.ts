import { retryAtFromHeaders } from "@/lib/auth-retry";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export class AuthUnavailableError extends Error {
  constructor(public readonly retryAt: number | null = null) {
    super("Authentication is temporarily unavailable.");
    this.name = "AuthUnavailableError";
  }
}
export class AuthForbiddenError extends Error {
  constructor() {
    super("This account cannot access this page.");
    this.name = "AuthForbiddenError";
  }
}

type AuthSession = { user?: { id: string } | null } | null;
type EffectiveUser = { id: string; email: string | null; role: "user" | "admin" };

const checkAuthResponse = (res: Response): boolean => {
  if (res.ok) return true;
  if (res.status === 401) return false;
  if (res.status === 403) throw new AuthForbiddenError();
  throw new AuthUnavailableError(retryAtFromHeaders(res.headers));
};

export const getSession = async (cookieString: string): Promise<AuthSession> => {
  const res = await fetch(`${API_URL}/api/auth/get-session`, {
    headers: { cookie: cookieString },
    cache: "no-store",
  }).catch(() => { throw new AuthUnavailableError(); });
  if (!checkAuthResponse(res)) return null;
  const body = await res.json().catch(() => { throw new AuthUnavailableError(); });
  if (body === null || (body?.session === null && body?.user === null)) return null;
  if (
    body?.session &&
    typeof body.session === "object" &&
    typeof body?.user?.id === "string" &&
    body.user.id.length > 0
  ) {
    return body;
  }
  throw new AuthUnavailableError();
};

export const getEffectiveUser = async (cookieString: string): Promise<EffectiveUser | null> => {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { cookie: cookieString },
    cache: "no-store",
  }).catch(() => { throw new AuthUnavailableError(); });
  if (!checkAuthResponse(res)) return null;
  try {
    const body = await res.json();
    if (
      body && typeof body.id === "string" && body.id.length > 0 &&
      (body.role === "user" || body.role === "admin") &&
      (body.email === null || typeof body.email === "string")
    ) return body;
    throw new AuthUnavailableError();
  } catch {
    throw new AuthUnavailableError();
  }
};
