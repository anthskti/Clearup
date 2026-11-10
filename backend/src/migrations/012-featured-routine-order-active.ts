import { DataTypes } from "sequelize";
import type { MigrationFn } from "umzug";

type Ctx = { sequelize: any; queryInterface: any };
const table = "featured_routines";

export const up: MigrationFn<Ctx> = async ({ context }) => {
  const { queryInterface, sequelize } = context;
  const tables = await queryInterface.showAllTables();
  if (!tables.some((name: string) => String(name).toLowerCase() === table)) return;

  const columns = await queryInterface.describeTable(table);
  const shouldBackfillOrder = !columns.position;
  if (shouldBackfillOrder) {
    await queryInterface.addColumn(table, "position", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  }
  if (!columns.isActive) {
    await queryInterface.addColumn(table, "isActive", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  }

  if (shouldBackfillOrder) await sequelize.query(`
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC, id ASC) - 1 AS rank
      FROM ${table}
    )
    UPDATE ${table} AS featured
    SET position = ordered.rank
    FROM ordered
    WHERE featured.id = ordered.id
  `);
};

export const down: MigrationFn<Ctx> = async ({ context }) => {
  const { queryInterface } = context;
  const tables = await queryInterface.showAllTables();
  if (!tables.some((name: string) => String(name).toLowerCase() === table)) return;
  const columns = await queryInterface.describeTable(table);
  if (columns.isActive) await queryInterface.removeColumn(table, "isActive");
  if (columns.position) await queryInterface.removeColumn(table, "position");
};
