import { DataTypes } from "sequelize";
import type { MigrationFn } from "umzug";

type Ctx = { sequelize: any; queryInterface: any };

export const up: MigrationFn<Ctx> = async ({ context }) => {
  const { queryInterface, sequelize } = context;
  const columns = await queryInterface.describeTable("products");

  if (!columns.skinTypeSource) {
    await queryInterface.addColumn("products", "skinTypeSource", {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "manual",
    });
  }

  await sequelize.query(`
    UPDATE products
    SET "skinTypeSource" = 'manual'
    WHERE "skinTypeSource" IS NULL OR BTRIM("skinTypeSource"::text) = '';
  `);
  await sequelize.query(`
    ALTER TABLE products
      ALTER COLUMN "skinTypeSource" SET DEFAULT 'manual',
      ALTER COLUMN "skinTypeSource" SET NOT NULL;
  `);
};

export const down: MigrationFn<Ctx> = async () => {
  // The column may predate this migration; keep provenance data on rollback.
};
