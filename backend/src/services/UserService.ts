import {
  AdminUserFilters,
  UserRepository,
} from "../repositories/UserRepository";
import type { AdminUserListRow } from "../types/user";

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
}
