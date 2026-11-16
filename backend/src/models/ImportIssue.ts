import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../db";

export type ImportIssueOutcome = "skipped" | "warning" | "failed" | "partial_success";

export interface ImportIssueAttributes {
  id: number;
  importId: number;
  recordNumber: number;
  sourceLineStart: number;
  sourceLineEnd: number;
  brand: string | null;
  name: string | null;
  code: string;
  outcome: ImportIssueOutcome;
  stage: string;
  reason: string;
}

export type ImportIssueCreationAttributes = Optional<ImportIssueAttributes, "id" | "brand" | "name">;

class ImportIssue extends Model<ImportIssueAttributes, ImportIssueCreationAttributes>
  implements ImportIssueAttributes {
  declare id: number;
  declare importId: number;
  declare recordNumber: number;
  declare sourceLineStart: number;
  declare sourceLineEnd: number;
  declare brand: string | null;
  declare name: string | null;
  declare code: string;
  declare outcome: ImportIssueOutcome;
  declare stage: string;
  declare reason: string;
}

ImportIssue.init({
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
}, {
  sequelize,
  tableName: "import_issues",
  timestamps: true,
  indexes: [{ name: "import_issues_import_id_id_idx", fields: ["importId", "id"] }],
});

export default ImportIssue;
