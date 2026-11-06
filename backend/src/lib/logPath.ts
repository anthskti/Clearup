/** Sanitize a path for logging without changing the request used by routing. */
export function sanitizeLogPath(url: string | undefined): string {
  const path = (url ?? "").split("?", 1)[0];
  // Express omits /api/auth inside mounted auth middleware. Match both forms.
  const redacted = path.replace(
    /^(\/(?:api\/auth\/)?reset-password\/)[^/]+/i,
    "$1[REDACTED]",
  );
  return redacted.slice(0, 512) || "/";
}
