import { Request, Response } from "express";
import PAGINATION from "../config/pagination";
import { handleInternalError } from "../lib/httpError";
import { UserService } from "../services/UserService";

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

      if (
        limit === null || limit < 1 || limit > MAX_LIMIT ||
        offset === null || offset < 0 || offset > MAX_OFFSET
      ) {
        res.status(400).json({ error: "Invalid pagination values." });
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
}
