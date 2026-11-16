import { DataTypes } from "sequelize";
import type { MigrationFn } from "umzug";

type Ctx = { sequelize: any; queryInterface: any };

export const up: MigrationFn<Ctx> = async ({ context }) => {
  const { queryInterface } = context;
  const tables = (await queryInterface.showAllTables()).map((name: unknown) => String(name).toLowerCase());
  if (!tables.includes("import_runs")) {
    await queryInterface.createTable("import_runs", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      importType: { type: DataTypes.STRING(20), allowNull: false },
      sourceName: { type: DataTypes.STRING(180), allowNull: false },
      actorId: { type: DataTypes.STRING, allowNull: true },
      requestId: { type: DataTypes.STRING(80), allowNull: true },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "processing" },
      startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      finishedAt: { type: DataTypes.DATE, allowNull: true },
      durationMs: { type: DataTypes.INTEGER, allowNull: true },
      received: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      processed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      updated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      skipped: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      failed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      warnings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      partialSuccess: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      reportComplete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  }
  const runColumns = await queryInterface.describeTable("import_runs");
  if (!runColumns.reportComplete) {
    await queryInterface.addColumn("import_runs", "reportComplete", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }
  const refreshedTables = (await queryInterface.showAllTables()).map((name: unknown) => String(name).toLowerCase());
  if (!refreshedTables.includes("import_issues")) {
    await queryInterface.createTable("import_issues", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      importId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "import_runs", key: "id" },
        onDelete: "RESTRICT",
      },
      recordNumber: { type: DataTypes.INTEGER, allowNull: false },
      sourceLineStart: { type: DataTypes.INTEGER, allowNull: false },
      sourceLineEnd: { type: DataTypes.INTEGER, allowNull: false },
      brand: { type: DataTypes.TEXT, allowNull: true },
      name: { type: DataTypes.TEXT, allowNull: true },
      code: { type: DataTypes.STRING(60), allowNull: false },
      outcome: { type: DataTypes.STRING(30), allowNull: false },
      stage: { type: DataTypes.STRING(40), allowNull: false },
      reason: { type: DataTypes.TEXT, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  }
  const indexes = await queryInterface.showIndex("import_issues");
  if (!indexes.some((index: { name?: string }) => index.name === "import_issues_import_id_id_idx")) {
    await queryInterface.addIndex("import_issues", ["importId", "id"], {
      name: "import_issues_import_id_id_idx",
    });
  }
};

// Import reports are retained; rolling back code must not remove the records.
export const down: MigrationFn<Ctx> = async () => {};
