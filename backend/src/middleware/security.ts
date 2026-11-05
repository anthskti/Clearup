import { NextFunction, Request, Response } from "express";
import { getClientIp, logSecurityEvent } from "../lib/security";
import { sanitizeLogPath } from "../lib/logPath";

/** Audit every auth request, including unknown paths and limiter rejections. */
export function authAuditLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  const path = req.path;
  res.on("finish", () => {
    logSecurityEvent("auth.route", {
      method: req.method,
      path: sanitizeLogPath(path),
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: getClientIp(req),
      requestId: req.id,
      userId: req.user?.id ?? null,
      body: null,
    });
  });
  next();
}
