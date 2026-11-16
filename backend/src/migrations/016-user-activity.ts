import type { MigrationFn } from "umzug";

type Ctx = { sequelize: any };

export const up: MigrationFn<Ctx> = async ({ context }) => {
  await context.sequelize.query(`
    CREATE TABLE IF NOT EXISTS "user_activity" (
      -- Retain activity if Better Auth deletes the corresponding user account.
      "userId" TEXT PRIMARY KEY,
      "lastActiveAt" TIMESTAMPTZ NOT NULL
    );
  `);
};

// Activity is retained even when rolling back application code.
export const down: MigrationFn<Ctx> = async () => {};
