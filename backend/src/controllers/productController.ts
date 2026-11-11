import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { ProductImportService } from "../services/ProductImportService";
import { MAX_PRODUCT_PAGE_SIZE, parseProductPagination } from "../lib/productPagination";
import { handleInternalError } from "../lib/httpError";
import { csvFromRequestBody } from "../middleware/parseCsvBody";
import { ImportReportFailure, ImportReportService } from "../services/ImportReportService";
import type { CsvImportResult, CsvRowError } from "../types/csv";
import type { ImportType } from "../models/ImportRun";
import {
  parseProductListQuery,
  hasProductListFilters,
} from "../lib/productFilterQuery";
import type { ProductCategory } from "../types/product";

export class ProductController {
  private productService: ProductService;
  private productImportService: ProductImportService;
  private importReportService: ImportReportService;

  constructor() {
    this.productService = new ProductService();
    this.productImportService = new ProductImportService();
    this.importReportService = new ImportReportService();
  }

  // GET /api/products/brands
  async getAllBrands(req: Request, res: Response): Promise<void> {
    try {
      const brands = await this.productService.getAllBrands();
      res.json(brands);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getAllBrands", error);
    }
  }

  // GET /api/products OR /api/products?search=name&skinType=oily,dry&brands=Anua
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const pagination = parseProductPagination(req.query);
      if (!pagination) {
        res.status(400).json({
          error: `limit must be an integer from 1 to ${MAX_PRODUCT_PAGE_SIZE}; offset must be a nonnegative safe integer`,
        });
        return;
      }
      const { limit, offset } = pagination;
      const searchQuery = req.query.search as string | undefined;
      const listFilters = parseProductListQuery(
        req.query as Record<string, unknown>,
      );

      if (searchQuery || hasProductListFilters(listFilters)) {
        const merged = { ...listFilters, query: searchQuery?.trim() || listFilters.query };
        const result = await this.productService.getProductsFilteredWithTotal(
          limit,
          offset,
          merged,
        );
        res.json(result);
      } else {
        const result = await this.productService.getAllProductsWithTotal(
          limit,
          offset,
        );
        res.json(result);
      }
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getAllProducts", error);
    }
  }

  // GET /api/products/category/:category
  // ?search=...&skinType=oily&brands=Anua&texture=Gel,Foam&limit=20&offset=0
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const pagination = parseProductPagination(req.query);
      if (!pagination) {
        res.status(400).json({
          error: `limit must be an integer from 1 to ${MAX_PRODUCT_PAGE_SIZE}; offset must be a nonnegative safe integer`,
        });
        return;
      }
      const { limit, offset } = pagination;
      const category = req.params.category as ProductCategory;
      const searchQuery = req.query.search as string | undefined;

      const listFilters = parseProductListQuery(
        req.query as Record<string, unknown>,
        category,
      );

      let result;
      if (searchQuery || hasProductListFilters(listFilters)) {
        result = await this.productService.searchProductsInCategoryWithTotal(
          category,
          searchQuery ?? "",
          limit,
          offset,
          listFilters,
        );
      } else {
        result = await this.productService.getProductsByCategoryWithTotal(
          category,
          limit,
          offset,
        );
      }
      res.json(result);
    } catch (error: unknown) {
      handleInternalError(
        res,
        "ProductController.getProductsByCategory",
        error,
      );
    }
  }

  // GET /api/products/category/:category/brands
  async getBrandsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const category = req.params.category as ProductCategory;
      const brands = await this.productService.getBrandsByCategory(category);
      res.json(brands);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getBrandsByCategory", error);
    }
  }
  // GET /api/product/:id
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.getProductById(
        req.params.id as string,
      );
      if (!product) {
        res.status(404).json({ error: "Product not found." });
        return;
      }
      res.json(product);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getProductById", error);
    }
  }

  // POST api/products
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(201).json(product);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.createProduct", error);
    }
  }

  // PUT /api/product/:id
  async updateProductbyId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const product = await this.productService.updateProduct(id, req.body);

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json(product);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.updateProductById", error);
    }
  }

  // DELETE /api/product/:id
  async DeleteProductbyId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const success = await this.productService.deleteProduct(id);

      if (!success) {
        res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.deleteProductById", error);
    }
  }

  // GET /api/products/merchants/batch?ids=1,2,3
  async getMerchantsBatch(req: Request, res: Response): Promise<void> {
    try {
      const raw = req.query.ids;
      if (raw === undefined || raw === "") {
        res.json({});
        return;
      }
      const MAX_IDS = 40; // One catalog page per batch; keep the database query bounded.
      if (typeof raw !== "string") {
        res.status(400).json({ error: "ids must be comma-separated positive integers" });
        return;
      }
      const values = raw.split(",").map((value) => value.trim());
      if (values.length > MAX_IDS) {
        res.status(400).json({ error: `At most ${MAX_IDS} product ids` });
        return;
      }
      if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1)) {
        res.status(400).json({ error: "ids must be comma-separated positive integers" });
        return;
      }
      const ids = [...new Set(values.map(Number))];
      const grouped =
        await this.productService.getMerchantsGroupedByProductId(ids);
      res.json(grouped);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getMerchantsBatch", error);
    }
  }

  // GET /api/id/:id/merchants
  async getMerchantsById(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id as string);
      const pm = await this.productService.getMerchantsByProductId(productId);
      res.json(pm);
    } catch (error: unknown) {
      handleInternalError(res, "ProductController.getMerchantsById", error);
    }
  }
  // POST /api/id/:id/merchants
  async addMerchantByProductId(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.id as string);
      const pm = await this.productService.addMerchantByProductId(
        productId,
        req.body,
      );

      res.status(201).json(pm);
    } catch (error: unknown) {
      handleInternalError(
        res,
        "ProductController.addMerchantByProductId",
        error,
      );
    }
  }

  // PUT /api/product-merchant/:id
  async updateProductMerchant(req: Request, res: Response): Promise<void> {
    try {
      const productMerchantId = parseInt(req.params.id as string);
      const pm = await this.productService.updateProductMerchant(
        productMerchantId,
        req.body,
      );
      if (!pm) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json(pm);
    } catch (error: unknown) {
      handleInternalError(
        res,
        "ProductController.updateProductMerchant",
        error,
      );
    }
  }
  // DELETE /api/product-merchant/:id
  async removeMerchantFromProduct(req: Request, res: Response): Promise<void> {
    try {
      const productMerchantId = parseInt(req.params.id as string);
      const success =
        await this.productService.removeMerchantFromProduct(productMerchantId);

      if (!success) {
        res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error: unknown) {
      handleInternalError(
        res,
        "ProductController.removeMerchantFromProduct",
        error,
      );
    }
  }
  // POST /api/products/admin/import/csv
  async importProductsCsv(req: Request, res: Response): Promise<void> {
    await this.runCsvImport(req, res, "products", (csv, onIssue) => this.productImportService.importProductsCsv(csv, onIssue));
  }

  // POST /api/products/admin/import/offers
  async importMerchantOffersCsv(req: Request, res: Response): Promise<void> {
    await this.runCsvImport(req, res, "offers", (csv, onIssue) => this.productImportService.importMerchantOffersCsv(csv, onIssue));
  }

  // POST /api/products/admin/import/prices
  async importPriceUpdatesCsv(req: Request, res: Response): Promise<void> {
    await this.runCsvImport(req, res, "prices", (csv, onIssue) => this.productImportService.importPriceUpdatesCsv(csv, onIssue));
  }

  private async runCsvImport(
    req: Request,
    res: Response,
    importType: ImportType,
    process: (csv: string, onIssue: (issue: CsvRowError) => Promise<void>) => Promise<CsvImportResult>,
  ): Promise<void> {
    const csv = csvFromRequestBody(req.body);
    if (!csv.trim()) {
      res.status(400).json({ error: "CSV content is required." });
      return;
    }
    const actorId = req.user?.id;
    if (!actorId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sourceHeader = req.headers["x-import-filename"];
    let requestedName = typeof sourceHeader === "string" ? sourceHeader : "pasted.csv";
    try { requestedName = decodeURIComponent(requestedName); } catch { /* Keep the original safe header text. */ }
    const sourceName = requestedName.replace(/\\/g, "/").split("/").pop()?.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180) || "pasted.csv";
    const requestId = typeof req.id === "string" ? req.id : null;
    try {
      const completed = await this.importReportService.runImport({
        importType,
        sourceName,
        actorId,
        requestId,
        csv,
        process,
      });
      res.status(200).json({ ...completed.result, importId: completed.importId, status: completed.status });
    } catch (error: unknown) {
      if (error instanceof ImportReportFailure) {
        res.status(500).json({ error: error.message, importId: error.importId });
        return;
      }
      handleInternalError(res, "ProductController.runCsvImport", error);
    }
  }

  private parseReportPage(req: Request): { limit: number; offset: number } | null {
    const parseQueryInt = (value: unknown, fallback: number): number | null => {
      if (value === undefined) return fallback;
      if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) ? parsed : null;
    };
    const limit = parseQueryInt(req.query.limit, 25);
    const offset = parseQueryInt(req.query.offset, 0);
    if (limit === null || offset === null) return null;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) return null;
    return { limit, offset };
  }

  async getImportHistory(req: Request, res: Response): Promise<void> {
    try {
      const page = await this.parseReportPage(req);
      if (!page) { res.status(400).json({ error: "limit must be 1–100 and offset must be a nonnegative integer" }); return; }
      res.json(await this.importReportService.listRuns(page.limit, page.offset));
    } catch (error: unknown) { handleInternalError(res, "ProductController.getImportHistory", error); }
  }

  async getImportRun(req: Request, res: Response): Promise<void> {
    const id = parsePositiveId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid import ID" }); return; }
    try {
      const run = await this.importReportService.getRun(id);
      if (!run) { res.status(404).json({ error: "Import not found" }); return; }
      res.json(run);
    } catch (error: unknown) { handleInternalError(res, "ProductController.getImportRun", error); }
  }

  async getImportIssues(req: Request, res: Response): Promise<void> {
    const id = parsePositiveId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid import ID" }); return; }
    try {
      const run = await this.importReportService.getRun(id);
      if (!run) { res.status(404).json({ error: "Import not found" }); return; }
      const page = await this.parseReportPage(req);
      if (!page) { res.status(400).json({ error: "limit must be 1–100 and offset must be a nonnegative integer" }); return; }
      res.json(await this.importReportService.listIssues(id, page.limit, page.offset));
    } catch (error: unknown) { handleInternalError(res, "ProductController.getImportIssues", error); }
  }

  async downloadImportReport(req: Request, res: Response): Promise<void> {
    const id = parsePositiveId(req.params.id);
    if (!id) { res.status(400).json({ error: "Invalid import ID" }); return; }
    try {
      const run = await this.importReportService.getRun(id);
      if (!run) { res.status(404).json({ error: "Import not found" }); return; }
      const issues = await this.importReportService.getFullReport(id);
      res.setHeader("Content-Disposition", `attachment; filename="import-${id}-report.json"`);
      res.json({ run, issues });
    } catch (error: unknown) { handleInternalError(res, "ProductController.downloadImportReport", error); }
  }
}

function parsePositiveId(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
