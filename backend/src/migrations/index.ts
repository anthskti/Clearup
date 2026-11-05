import { Umzug, SequelizeStorage } from "umzug";
import sequelize from "../db";
import logger from "../lib/logger";

export function createMigrator() {
  return new Umzug({
    migrations: {
      glob: ["[0-9]*.{js,ts}", { cwd: __dirname, ignore: ["*.d.ts", "*.map"] }],
    },
    context: {
      sequelize,
      queryInterface: sequelize.getQueryInterface(),
    },
    storage: new SequelizeStorage({
      sequelize,
      tableName: "sequelize_meta",
    }),
    logger,
  });
}

export async function runMigrations(): Promise<void> {
  const migrator = createMigrator();
  const executed = await migrator.up();
  if (executed.length > 0) {
    logger.info({ event: "database.migrations.applied", migrationCount: executed.length, migrations: executed.map((m) => m.name) }, "Database migrations applied");
  } else {
    logger.info({ event: "database.migrations.none" }, "No pending migrations");
  }
}
