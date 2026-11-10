import UserModel from "../models/User";
import { Op, literal } from "sequelize";
import { BasicUserRow, UserDailyCountRow } from "../types/user";

export type AdminUserListRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
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
    limit: number,
    offset: number,
  ): Promise<{ rows: AdminUserListRow[]; total: number }> {
    const { rows, count } = await UserModel.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "name",
        "email",
        "emailVerified",
        "role",
        "createdAt",
      ],
      raw: true,
    });

    const mapped = (rows as unknown as AdminUserListRow[]).map((u) => {
      const raw = u.createdAt as unknown;
      const createdAt =
        raw instanceof Date ? raw.toISOString() : String(raw ?? "");
      return { ...u, createdAt };
    });

    return { rows: mapped, total: count };
  }
}
