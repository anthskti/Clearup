import {
  AdminUserFilters,
  UserRepository,
} from "../repositories/UserRepository";
import type { AdminUserListRow } from "../types/user";
import type {
  ModerationAction,
  ModerationResult,
} from "../repositories/UserRepository";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async listAdminUsers(
    filters: AdminUserFilters,
  ): Promise<{ rows: AdminUserListRow[]; total: number }> {
    return this.userRepository.findAllPaginated(filters);
  }

  async moderateUser(
    targetId: string,
    actorId: string,
    moderation: ModerationAction,
  ): Promise<"missing" | "protected" | ModerationResult> {
    if (targetId === actorId) {
      return "protected";
    }

    const adminEmails = new Set(
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
    const result = await this.userRepository.moderateUser(
      targetId,
      moderation,
      (target) => target.role === "admin" || adminEmails.has(target.email.trim().toLowerCase()),
    );
    return result ?? "missing";
  }
}
