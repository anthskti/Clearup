import ImportIssue, { type ImportIssueCreationAttributes } from "../models/ImportIssue";
import ImportRun, { type ImportRunCreationAttributes } from "../models/ImportRun";

export class ImportReportRepository {
  createRun(input: ImportRunCreationAttributes) {
    return ImportRun.create(input);
  }

  async finishRun(
    id: number,
    update: Partial<Pick<ImportRunCreationAttributes,
      "status" | "finishedAt" | "durationMs" | "received" | "processed" | "created" |
      "updated" | "skipped" | "failed" | "warnings" | "partialSuccess" | "reportComplete"
    >>,
  ): Promise<void> {
    await ImportRun.update(update, { where: { id } });
  }

  addIssue(input: ImportIssueCreationAttributes) {
    return ImportIssue.create(input);
  }

  async findRuns(limit: number, offset: number) {
    const { rows, count } = await ImportRun.findAndCountAll({
      limit,
      offset,
      order: [["id", "DESC"]],
      raw: true,
    });
    return { rows, total: count };
  }

  findRun(id: number) {
    return ImportRun.findByPk(id, { raw: true });
  }

  async findIssues(importId: number, limit: number, offset: number) {
    const { rows, count } = await ImportIssue.findAndCountAll({
      where: { importId },
      limit,
      offset,
      order: [["id", "ASC"]],
      raw: true,
    });
    return { rows, total: count };
  }

  findAllIssues(importId: number) {
    return ImportIssue.findAll({ where: { importId }, order: [["id", "ASC"]], raw: true });
  }
}
