import UserModel from "../models/User";
import { Op, literal, type WhereOptions } from "sequelize";
import { AdminUserListRow, BasicUserRow, UserDailyCountRow } from "../types/user";

export type AdminUserFilters = {
  limit: number;
  offset: number;
  search?: string;
  role?: string;
  verified?: boolean;
};

export class UserRepository {
  // GET Total Users
  async countAll(): Promise<number> {
    return UserModel.count();
  }

  // GET Recent Users
  async getDailyUserCounts(start: Date, endExclusive: Date): Promise<UserDailyCountRow[]> {
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
    const { limit, offset, search, role, verified } = filters;
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
      return { ...u, createdAt, routineCount: Number(u.routineCount ?? 0) };
    });

    return { rows: mapped, total: count };
  }
}
