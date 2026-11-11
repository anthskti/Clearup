import { DataTypes } from "sequelize";
import type { MigrationFn } from "umzug";
import { createHash } from "node:crypto";

type Ctx = { queryInterface: any };

export const up: MigrationFn<Ctx> = async ({ context }) => {
  const { queryInterface } = context;
  const tables = (await queryInterface.showAllTables()).map((name: unknown) => String(name).toLowerCase());
  if (!tables.includes("import_jobs")) {
    await queryInterface.createTable("import_jobs", {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      importId: { type: DataTypes.INTEGER, allowNull: false, unique: true, references: { model: "import_runs", key: "id" }, onDelete: "RESTRICT" },
      importType: { type: DataTypes.STRING(20), allowNull: false }, sourceName: { type: DataTypes.STRING(180), allowNull: false },
      actorId: { type: DataTypes.STRING, allowNull: false }, submissionKey: { type: DataTypes.STRING(80), allowNull: false },
      csvHash: { type: DataTypes.STRING(64), allowNull: false },
      csv: { type: DataTypes.TEXT, allowNull: false }, status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "queued" },
      attemptId: { type: DataTypes.STRING(36), allowNull: true }, heartbeatAt: { type: DataTypes.DATE, allowNull: true },
      progressRecord: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      progressReceived: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, progressProcessed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      progressCreated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, progressUpdated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      progressSkipped: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, progressFailed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      progressWarnings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, progressPartialSuccess: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      error: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false }, updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  }
  await upgradeImportJobsSchema(queryInterface);
};

/** Additive repair helper also called by migration 015 for installations that ran the first 014 draft. */
export async function upgradeImportJobsSchema(queryInterface: any): Promise<void> {
  const columns = await queryInterface.describeTable("import_jobs");
  const additions: Record<string, unknown> = {
    csvHash: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "" },
    heartbeatAt: { type: DataTypes.DATE, allowNull: true },
    progressRecord: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressReceived: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressProcessed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressCreated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressUpdated: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressSkipped: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressFailed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressWarnings: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    progressPartialSuccess: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    error: { type: DataTypes.TEXT, allowNull: true },
  };
  for (const [name, definition] of Object.entries(additions)) {
    if (!columns[name]) await queryInterface.addColumn("import_jobs", name, definition);
  }
  await queryInterface.sequelize.query(
    `UPDATE import_jobs SET status='needs_review', error='Legacy processing job has no attempt heartbeat; automatic replay is disabled.'
     WHERE status='processing' AND "heartbeatAt" IS NULL`,
  );
  const oldRows = await queryInterface.sequelize.query(
    `SELECT id, csv FROM import_jobs WHERE "csvHash"=''`,
    { type: "SELECT" },
  ) as Array<{ id: number; csv: string }>;
  for (const row of oldRows) {
    const csvHash = createHash("sha256").update(row.csv, "utf8").digest("hex");
    await queryInterface.sequelize.query(
      `UPDATE import_jobs SET "csvHash"=:hash WHERE id=:id AND "csvHash"=''`,
      { replacements: { id: row.id, hash: csvHash } },
    );
  }
  const constraints = await queryInterface.showConstraint("import_jobs");
  const indexes = await queryInterface.showIndex("import_jobs");
  for (const index of indexes) {
    const fields = (index.fields ?? []).map((field: any) => field.attribute ?? field.name);
    if (!index.unique || fields.length !== 1 || fields[0] !== "submissionKey") continue;
    const constraint = constraints.find((entry: any) =>
      entry.constraintType === "UNIQUE" && entry.constraintName === index.name,
    );
    if (constraint) await queryInterface.removeConstraint("import_jobs", constraint.constraintName);
    else await queryInterface.removeIndex("import_jobs", index.name);
  }
  const refreshedIndexes = await queryInterface.showIndex("import_jobs");
  if (!refreshedIndexes.some((index: any) => index.name === "import_jobs_actor_submission_key_uq")) {
    await queryInterface.addIndex("import_jobs", ["actorId", "submissionKey"], { unique: true, name: "import_jobs_actor_submission_key_uq" });
  }
}

// Jobs and payloads are retained alongside import reports.
export const down: MigrationFn<Ctx> = async () => {};
