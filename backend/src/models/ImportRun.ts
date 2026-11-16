import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db";

export type ImportType = "products" | "offers" | "prices";
export type ImportStatus = "processing" | "completed" | "partial" | "failed";

export interface ImportRunAttributes {
  id: number;
  importType: ImportType;
  sourceName: string;
  actorId: string | null;
  requestId: string | null;
  status: ImportStatus;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  received: number;
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  warnings: number;
  partialSuccess: number;
  reportComplete: boolean;
}

export type ImportRunCreationAttributes = Optional<ImportRunAttributes,
  "id" | "actorId" | "requestId" | "status" | "startedAt" | "finishedAt" |
  "durationMs" | "received" | "processed" | "created" | "updated" | "skipped" |
  "failed" | "warnings" | "partialSuccess" | "reportComplete"
>;

class ImportRun extends Model<ImportRunAttributes, ImportRunCreationAttributes>
  implements ImportRunAttributes {
  declare id: number;
  declare importType: ImportType;
  declare sourceName: string;
  declare actorId: string | null;
  declare requestId: string | null;
  declare status: ImportStatus;
  declare startedAt: Date;
  declare finishedAt: Date | null;
  declare durationMs: number | null;
  declare received: number;
  declare processed: number;
  declare created: number;
  declare updated: number;
  declare skipped: number;
  declare failed: number;
  declare warnings: number;
  declare partialSuccess: number;
  declare reportComplete: boolean;
}

ImportRun.init({
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
}, { sequelize, tableName: "import_runs", timestamps: true });

export default ImportRun;
