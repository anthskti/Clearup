let sessionRetryAt: number | null = null;

export function isTemporaryAuthError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return status !== 401 && status !== 403;
}

export function retryAtFromHeaders(headers: Headers): number | null {
  const value = headers.get("Retry-After") ?? headers.get("X-Retry-After");
  if (!value) return null;
  const seconds = Number(value);
  const at = Number.isFinite(seconds)
    ? Date.now() + Math.max(0, seconds) * 1000
    : Date.parse(value);
  return Number.isFinite(at) ? at : null;
}

export function captureSessionRetryAt(url: URL | string, response: Response) {
  if (!String(url).includes("/api/auth/get-session")) return;
  sessionRetryAt = retryAtFromHeaders(response.headers);
}

export function getSessionRetryAt() {
  return sessionRetryAt;
}
