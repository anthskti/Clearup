import { Request } from "express";
import logger from "./logger";

const SENSITIVE_KEYS = new Set([
  "password",
  "newpassword",
  "token",
  "accesstoken",
  "refreshtoken",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
  "email",
  "body",
  "headers",
  "query",
  "url",
]);

type JsonLike = Record<string, unknown> | unknown[] | unknown;

export function redactSensitiveFields(value: JsonLike): JsonLike {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveFields(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, unknown>
  >((acc, [key, nestedValue]) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      acc[key] = "[REDACTED]";
      return acc;
    }

    acc[key] = redactSensitiveFields(nestedValue);
    return acc;
  }, {});
}

export function getClientIp(req: Request): string {
  // Express resolves req.ip using the configured trusted proxy chain. Never trust
  // the leftmost user-supplied X-Forwarded-For value directly.
  return req.ip || "unknown";
}

export function logSecurityEvent(
  event: string,
  metadata: Record<string, unknown>,
): void {
  const safeMetadata = redactSensitiveFields(metadata) as Record<string, unknown>;
  logger.info({ event: "security.audit", securityEvent: event, ...safeMetadata }, "Security event");
}

export function validateSecurityConfig(): void {
  const nodeEnv = process.env.NODE_ENV || "development";
  const trustedOrigins =
    process.env.TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? ["http://localhost:3000"];

  if (nodeEnv === "production") {
    const authUrl =
      process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "") ||
      process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "") ||
      "";
    if (!authUrl) {
      logger.warn({ event: "security.config", config: "BETTER_AUTH_URL" }, "Production auth URL is not configured");
    }

    const hasWildcardOrigin = trustedOrigins.some((origin) => origin === "*");
    if (hasWildcardOrigin) {
      logger.warn({ event: "security.config", config: "TRUSTED_ORIGINS" }, "Wildcard trusted origin configured in production");
    }
  }
}
