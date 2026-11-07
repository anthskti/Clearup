import pino, { type Logger } from "pino";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sanitizeLogPath } from "./logPath";

// Both src/lib and dist/lib live two levels below the API root, including /app in Docker.
const applicationRoot = resolve(__dirname, "../..");
const safeLocationPattern = /^backend\/(?:src|dist)\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:ts|js):\d+:\d+$/;

function stackLocation(frame: string): string[] {
  if (!/^\s*at\s/.test(frame)) return [];
  const match = frame.match(/((?:file:\/\/)?\/[^():]+):(\d+):(\d+)\)?\s*$/);
  if (!match) return [];

  try {
    const filename = match[1].startsWith("file://") ? fileURLToPath(match[1]) : match[1];
    const path = relative(applicationRoot, filename).replace(/\\/g, "/");
    const location = `backend/${path}:${match[2]}:${match[3]}`;
    // Keep only application files; omit host directories, dependency frames and raw stack text.
    return safeLocationPattern.test(location) && !path.split("/").includes("node_modules")
      ? [location]
      : [];
  } catch {
    return [];
  }
}

const configuredLevel = process.env.LOG_LEVEL;
const allowedLevels = ["fatal", "error", "warn", "info", "debug", "trace", "silent"];
const level = configuredLevel && allowedLevels.includes(configuredLevel)
  ? configuredLevel
  : process.env.NODE_ENV === "production"
    ? "info"
    : "debug";
const allowedEnvironments = ["development", "staging", "production"];
const environment = allowedEnvironments.includes(process.env.APP_ENV ?? "")
  ? process.env.APP_ENV
  : process.env.NODE_ENV === "production"
    ? "production"
    : "development";
const sensitiveKeys = new Set([
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

function sanitize(
  value: unknown,
  seen = new WeakSet<object>(),
  depth = 0,
): unknown {
  if (value instanceof Error) return safeError(value);
  if (Array.isArray(value)) {
    return depth > 8
      ? "[TRUNCATED]"
      : value.map((item) => sanitize(item, seen, depth + 1));
  }
  if (!value || typeof value !== "object") return value;
  if (depth > 8 || seen.has(value)) return "[CIRCULAR]";
  seen.add(value);
  const input = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(input).map(([key, nested]) => {
      const normalized = key.toLowerCase();
      if (sensitiveKeys.has(normalized)) return [key, "[REDACTED]"];
      if (normalized === "req" && nested && typeof nested === "object") {
        const req = nested as { id?: unknown; method?: unknown; url?: unknown; path?: unknown };
        const path = typeof req.path === "string" ? req.path : req.url;
        return [
          key,
          {
            id: req.id,
            method: req.method,
            path: typeof path === "string" ? sanitizeLogPath(path) : undefined,
          },
        ];
      }
      if (normalized === "res" && nested && typeof nested === "object") {
        return [
          key,
          { statusCode: (nested as { statusCode?: unknown }).statusCode },
        ];
      }
      if (normalized === "err" || normalized === "error") {
        return [key, safeError(nested)];
      }
      return [key, sanitize(nested, seen, depth + 1)];
    }),
  );
}

/** Structured application logger. Output remains JSON in every environment. */
const logger = pino({
  level,
  base: { service: "clearup-api", environment },
  redact: {
    paths: [
      "*.password",
      "*.token",
      "*.authorization",
      "*.cookie",
      "*.email",
      "*.body",
      "*.headers",
      "*.query",
      "*.url",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    err: (error: unknown) => safeError(error),
  },
  hooks: {
    logMethod(args, method) {
      return method.apply(
        this,
        args.map((arg) => sanitize(arg)) as [unknown, string?, ...unknown[]],
      );
    },
  },
});

export type SafeErrorContext = {
  scope?: string;
  requestId?: string;
  code?: string;
  statusCode?: number;
};

export function safeError(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") return { name: "Error" };
  const source = error as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    stack?: unknown;
    locations?: unknown;
  };
  const result: Record<string, unknown> = {
    name: typeof source.name === "string" ? source.name.slice(0, 80) : "Error",
  };
  if (typeof source.code === "string" && /^[A-Z0-9_-]{1,40}$/i.test(source.code)) result.code = source.code;
  const status = source.statusCode ?? source.status;
  if (typeof status === "number" && Number.isInteger(status) && status >= 400 && status <= 599) result.statusCode = status;
  if (typeof source.stack === "string") {
    const locations = source.stack
      .split("\n")
      .slice(1)
      .flatMap(stackLocation)
      .slice(0, 3);
    if (locations.length) result.locations = locations;
  }
  if (Array.isArray(source.locations)) {
    const locations = source.locations
      .filter(
        (location): location is string =>
          typeof location === "string" &&
          safeLocationPattern.test(location) &&
          !location.split("/").includes("node_modules"),
      )
      .slice(0, 3);
    if (locations.length) result.locations = locations;
  }
  return result;
}

/** Safe reporting boundary for application errors; never emits error messages or stacks. */
export function reportError(
  error: unknown,
  context: SafeErrorContext = {},
  target: Logger = logger,
): void {
  target.error({ event: "application.error", ...context, error: safeError(error) }, "Application error");
}

export default logger;
