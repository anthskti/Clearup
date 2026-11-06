import type { ErrorRequestHandler, Response } from "express";
import { reportError } from "./logger";

interface HttpErrorLike {
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  413: "Payload Too Large",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
};

/** Handles explicit 500 errors in route handlers/controllers. */
export function handleInternalError(
  res: Response,
  scope: string,
  error: unknown,
): void {
  reportError(error, { scope }, res.req.log);

  if (!res.headersSent) {
    res.status(500).json({ error: DEFAULT_MESSAGES[500] });
  }
}

/** Final Express boundary for body-parser, middleware, and unhandled errors. */
export const handleExpressError: ErrorRequestHandler = (
  error: unknown,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    return next(error);
  }

  const candidate = (error && typeof error === "object" ? error : {}) as HttpErrorLike;
  const rawStatus = candidate.statusCode ?? candidate.status;
  const statusCode =
    typeof rawStatus === "number" && rawStatus >= 400 && rawStatus <= 599
      ? rawStatus
      : 500;

  if (statusCode >= 500) {
    reportError(error, { scope: "express", statusCode }, req.log);
  }

  if (candidate.type === "entity.parse.failed") {
    return res.status(statusCode).json({ error: "Invalid JSON" });
  }
  if (candidate.type === "entity.too.large") {
    return res.status(statusCode).json({ error: "Payload Too Large" });
  }

  const message =
    DEFAULT_MESSAGES[statusCode] ??
    (statusCode < 500 ? "Client Error" : DEFAULT_MESSAGES[500]);
  return res.status(statusCode).json({ error: message });
};
