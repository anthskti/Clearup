export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  routineCount: number;
  accountStatus: "active" | "suspended" | "banned";
  banReason: string | null;
  banExpires: string | null;
};

export type AdminUsersPagePayload = {
  users: AdminUserRow[];
  total: number;
  limit: number;
  offset: number;
};

export type AdminUsersQuery = {
  limit?: number;
  offset?: number;
  search?: string;
  role?: "user" | "admin";
  verified?: boolean;
  status?: "active" | "suspended" | "banned";
};
