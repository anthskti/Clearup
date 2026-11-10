export type UserDailyCountRow = {
  /** UTC calendar day formatted as YYYY-MM-DD by the repository query. */
  day: string;
  count: string | number;
};

export type BasicUserRow = {
  id: string;
  name: string;
  email: string;
};

export type AdminUserListRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  routineCount: number;
};
