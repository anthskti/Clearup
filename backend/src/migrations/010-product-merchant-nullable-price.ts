import type { MigrationFn } from "umzug";

type Ctx = { sequelize: any; queryInterface: any };

export const up: MigrationFn<Ctx> = async ({ context }) => {
  await context.sequelize.query(
    "ALTER TABLE product_merchants ALTER COLUMN price DROP NOT NULL;",
  );
};

export const down: MigrationFn<Ctx> = async ({ context }) => {
  const [rows] = await context.sequelize.query(
    "SELECT COUNT(*)::int AS count FROM product_merchants WHERE price IS NULL;",
  );
  if (Number(rows[0]?.count ?? 0) > 0) {
    throw new Error(
      "Cannot restore product_merchants.price NOT NULL while null prices exist.",
    );
  }
  await context.sequelize.query(
    "ALTER TABLE product_merchants ALTER COLUMN price SET NOT NULL;",
  );
};
