import UserModel from "../models/User";
import SessionModel from "../models/Session";
import sequelize from "../db";
import { Op, literal, type WhereOptions } from "sequelize";
import { AdminUserListRow, BasicUserRow, UserDailyCountRow } from "../types/user";

export type AdminUserFilters = {
  limit: number;
  offset: number;
  search?: string;
  role?: string;
  verified?: boolean;
  status?: "active" | "suspended" | "banned";
};

export type ModerationAction =
  | { action: "suspend"; durationDays: 1 | 7 | 30; reason: string }
  | { action: "ban"; reason: string }
  | { action: "restore" };

export type ModerationResult = {
  accountStatus: "active" | "suspended" | "banned";
  banReason: string | null;
  banExpires: string | null;
};

export class UserRepository {
  // GET Total Users
  async countAll(): Promise<number> {
    return UserModel.count();
  }

  // GET Recent Users
  async getDailyUserCounts(
    start: Date,
    endExclusive: Date,
  ): Promise<UserDailyCountRow[]> {
    return UserModel.findAll({
      where: {
        createdAt: {
          [Op.gte]: start,
          [Op.lt]: endExclusive,
        },
      } as any,
      attributes: [
        [literal(`TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD')`), "day"],
        [literal("COUNT(*)"), "count"],
      ],
      group: ["day"],
      raw: true,
    }) as unknown as UserDailyCountRow[];
  }

  // GET with id, return name and email.
  async findBasicByIds(ids: string[]): Promise<BasicUserRow[]> {
    if (!ids.length) {
      return [];
    }
    return UserModel.findAll({
      where: { id: { [Op.in]: ids } },
      attributes: ["id", "name", "email"],
      raw: true,
    }) as unknown as BasicUserRow[];
  }

  async findAllPaginated(
    filters: AdminUserFilters,
  ): Promise<{ rows: AdminUserListRow[]; total: number }> {
    const { limit, offset, search, role, verified, status } = filters;
    const where: WhereOptions = {};
    if (search) {
      // Treat SQL LIKE metacharacters in admin search as literal characters.
      const escapedSearch = search.replace(/[\\%_]/g, "\\$&");
      Object.assign(where, {
        [Op.or]: [
          { id: { [Op.iLike]: `%${escapedSearch}%` } },
          { name: { [Op.iLike]: `%${escapedSearch}%` } },
          { email: { [Op.iLike]: `%${escapedSearch}%` } },
        ],
      });
    }
    if (role) Object.assign(where, { role });
    if (verified !== undefined) {
      Object.assign(where, { emailVerified: verified });
    }
    const now = new Date();
    if (status === "active") {
      Object.assign(where, {
        [Op.and]: [{ [Op.or]: [{ banned: false }, { banExpires: { [Op.lte]: now } }] }],
      });
    }
    if (status === "suspended") {
      Object.assign(where, { banned: true, banExpires: { [Op.gt]: now } });
    }
    if (status === "banned") {
      Object.assign(where, { banned: true, banExpires: null });
    }

    const { rows, count } = await UserModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      attributes: [
        "id",
        "name",
        "email",
        "emailVerified",
        "role",
        "createdAt",
        "banned",
        "banReason",
        "banExpires",
        [
          literal(
            '(SELECT COUNT(*)::int FROM "routines" AS "routine_count" WHERE "routine_count"."userId" = "User"."id")',
          ),
          "routineCount",
        ],
      ],
      raw: true,
    });

    const mapped = (rows as unknown as AdminUserListRow[]).map((u) => {
      const raw = u.createdAt as unknown;
      const createdAt =
        raw instanceof Date ? raw.toISOString() : String(raw ?? "");
      const expiry = u.banExpires as unknown;
      const banExpires = expiry instanceof Date
        ? expiry.toISOString()
        : expiry
          ? new Date(String(expiry)).toISOString()
          : null;
      const accountStatus: AdminUserListRow["accountStatus"] =
        u.banned && (!banExpires || new Date(banExpires) > now)
          ? banExpires
            ? "suspended"
            : "banned"
          : "active";
      return {
        ...u,
        createdAt,
        banExpires,
        accountStatus,
        routineCount: Number(u.routineCount ?? 0),
      };
    });

    return { rows: mapped, total: count };
  }

  async findRestriction(userId: string): Promise<{
    banned: boolean;
    banReason: string | null;
    banExpires: Date | null;
  } | null> {
    const user = await UserModel.findByPk(userId, {
      attributes: ["banned", "banReason", "banExpires"],
    });
    if (!user) return null;
    return { banned: user.banned, banReason: user.banReason, banExpires: user.banExpires };
  }

  async findModerationTarget(userId: string): Promise<{
    id: string;
    email: string;
    role: string;
  } | null> {
    const user = await UserModel.findByPk(userId, {
      attributes: ["id", "email", "role"],
    });
    return user ? { id: user.id, email: user.email, role: user.role } : null;
  }

  async moderateUser(
    userId: string,
    moderation: ModerationAction,
  ): Promise<ModerationResult | null> {
    const now = new Date();
    const fields = moderation.action === "restore"
      ? { banned: false, banReason: null, banExpires: null }
      : moderation.action === "suspend"
        ? {
            banned: true,
            banReason: moderation.reason,
            banExpires: new Date(
              now.getTime() + moderation.durationDays * 86_400_000,
            ),
          }
        : { banned: true, banReason: moderation.reason, banExpires: null };
    return sequelize.transaction(async (transaction) => {
      const [count] = await UserModel.update(fields, { where: { id: userId }, transaction });
      if (!count) return null;
      await SessionModel.update({ expiresAt: now }, { where: { userId }, transaction });
      const banExpires = fields.banExpires;
      const accountStatus: ModerationResult["accountStatus"] =
        moderation.action === "restore"
          ? "active"
          : moderation.action === "ban"
            ? "banned"
            : "suspended";
      return {
        accountStatus,
        banReason: fields.banReason,
        banExpires: banExpires ? banExpires.toISOString() : null,
      };
    });
  }
}
