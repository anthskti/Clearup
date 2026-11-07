import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import {
  getPgSslConfig,
  resolveDatabaseUrl,
  usesCloudDatabase,
} from "./lib/dbConfig";
import logger from "./lib/logger";

dotenv.config({ quiet: true });

const connectionString = resolveDatabaseUrl();
const ssl = getPgSslConfig();

if (usesCloudDatabase()) {
  logger.info({ event: "database.config", mode: "cloud" }, "Database configured");
} else {
  logger.info({ event: "database.config", mode: "local" }, "Database configured");
}

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  logging: false,
  ...(ssl ? { dialectOptions: { ssl } } : {}),
});

export default sequelize;
