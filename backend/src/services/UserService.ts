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

    const target = await this.userRepository.findModerationTarget(targetId);
    if (!target) {
      return "missing";
    }

    const adminEmails = new Set(
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
    const targetEmail = target.email.trim().toLowerCase();
    if (target.role === "admin" || adminEmails.has(targetEmail)) {
      return "protected";
    }

    const result = await this.userRepository.moderateUser(targetId, moderation);
    return result ?? "missing";
  }
}
