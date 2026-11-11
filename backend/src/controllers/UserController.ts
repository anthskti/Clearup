import { Request, Response } from "express";
import PAGINATION from "../config/pagination";
import { handleInternalError } from "../lib/httpError";
import { UserService } from "../services/UserService";
import { logSecurityEvent } from "../lib/security";

const MAX_LIMIT = 100;
const MAX_OFFSET = 10_000_000;
const MAX_SEARCH_LENGTH = 100;

function queryString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // GET /api/users/admin
  async listAdminUsers(req: Request, res: Response): Promise<void> {
    try {
      const rawLimit = req.query.limit;
      const rawOffset = req.query.offset;
      const limit = rawLimit === undefined ? PAGINATION.LIMIT : parseInteger(rawLimit);
      const offset = rawOffset === undefined ? PAGINATION.OFFSET : parseInteger(rawOffset);
      const rawSearch = queryString(req.query.search);
      const search = rawSearch?.trim();
      const role = queryString(req.query.role);
      const rawVerified = queryString(req.query.verified);
      const rawStatus = queryString(req.query.status);

      if (
        limit === null || limit < 1 || limit > MAX_LIMIT ||
        offset === null || offset < 0 || offset > MAX_OFFSET
      ) {
        res.status(400).json({ error: "Invalid pagination values." });
        return;
      }
      if (
        req.query.status !== undefined &&
        !["active", "suspended", "banned"].includes(rawStatus ?? "")
      ) {
        res.status(400).json({ error: "Status must be active, suspended, or banned." });
        return;
      }
      if (req.query.search !== undefined && rawSearch === undefined) {
        res.status(400).json({ error: "Search must be a single text value." });
        return;
      }
      if (search && search.length > MAX_SEARCH_LENGTH) {
        res.status(400).json({ error: "Search must be 100 characters or fewer." });
        return;
      }
      if (req.query.role !== undefined && !["user", "admin"].includes(role ?? "")) {
        res.status(400).json({ error: "Role must be user or admin." });
        return;
      }
      if (
        req.query.verified !== undefined &&
        rawVerified !== "true" && rawVerified !== "false"
      ) {
        res.status(400).json({ error: "Verified must be true or false." });
        return;
      }

      const result = await this.userService.listAdminUsers({
        limit,
        offset,
        search: search || undefined,
        role,
        verified: rawVerified === undefined ? undefined : rawVerified === "true",
        status: rawStatus as "active" | "suspended" | "banned" | undefined,
      });
      res.json({
        users: result.rows,
        total: result.total,
        limit,
        offset,
      });
    } catch (error: unknown) {
      handleInternalError(res, "UserController.listAdminUsers", error);
    }
  }

  async moderateUser(req: Request, res: Response): Promise<void> {
    const targetId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const body = req.body as Record<string, unknown> | undefined;
    let moderation;
    if (body?.action === "restore" && Object.keys(body).length === 1) {
      moderation = { action: "restore" as const };
    } else if (
      body?.action === "ban" &&
      typeof body.reason === "string"
    ) {
      const reason = body.reason.trim();
      const hasUnexpectedField = Object.keys(body).some(
        (key) => !["action", "reason"].includes(key),
      );
      if (!reason || reason.length > 255 || hasUnexpectedField) {
        res.status(400).json({ error: "A reason of 1 to 255 characters is required." });
        return;
      }
      moderation = { action: "ban" as const, reason };
    } else if (
      body?.action === "suspend" &&
      typeof body.reason === "string" &&
      [1, 7, 30].includes(body.durationDays as number)
    ) {
      const reason = body.reason.trim();
      const hasUnexpectedField = Object.keys(body).some(
        (key) => !["action", "reason", "durationDays"].includes(key),
      );
      if (!reason || reason.length > 255 || hasUnexpectedField) {
        res.status(400).json({ error: "A reason of 1 to 255 characters is required." });
        return;
      }
      moderation = { action: "suspend" as const, durationDays: body.durationDays as 1 | 7 | 30, reason };
    } else {
      res.status(400).json({ error: "Invalid moderation action or fields." });
      return;
    }

    try {
      const actorId = req.user?.id;
      if (!actorId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const result = await this.userService.moderateUser(targetId, actorId, moderation);
      if (result === "missing") {
        res.status(404).json({ error: "User not found." });
        return;
      }
      if (result === "protected") {
        res.status(403).json({ error: "This account cannot be moderated." });
        return;
      }
      logSecurityEvent("user.moderation", {
        actorId,
        targetId,
        action: moderation.action,
        expiresAt: result.banExpires,
      });
      res.json({ ok: true, ...result });
    } catch (error: unknown) {
      handleInternalError(res, "UserController.moderateUser", error);
    }
  }
}
