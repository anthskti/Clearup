import { ProductRepository } from "../repositories/ProductRepository";
import { ProductMerchantRepository } from "../repositories/ProductMerchantRepository";
import { MerchantRepository } from "../repositories/MerchantRepository";
import { RoutineProductRepository } from "../repositories/RoutineProductRepository";
import {
  parseCsvDocument,
  parseCategory,
  parseImageUrls,
  parseInstructions,
  parseLabels,
  parseOfferPrice,
  parseOfferStock,
  parseScraperPrice,
  parseSkinTypes,
  isScraperRowSuccessful,
  parseMerchantName,
} from "../lib/csvProductImport";
import {
  emptyCsvResult,
  invalidCsvHeaders,
  persistHeaderIssue,
  persistNewIssues,
  safeRowFailure,
  type ImportIssueWriter,
} from "../lib/csvImportResults";
import type { ProductSkinTypeSource } from "../models/Product";
import type { ProductCategory } from "../types/product";
import type { CsvImportResult, CsvRowError } from "../types/csv";

export class ProductImportService {
  private productRepository: ProductRepository;
  private productMerchantRepository: ProductMerchantRepository;
  private merchantRepository: MerchantRepository;
  private routineProductRepository: RoutineProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.productMerchantRepository = new ProductMerchantRepository();
    this.merchantRepository = new MerchantRepository();
    this.routineProductRepository = new RoutineProductRepository();
  }

  // POST batch import from datascraper CSV:
  // name, brand, category, labels, skinType, country, capacity, price, instructions,
  // ingredients, imageUrls, averageRating, url, merchant, status
  async importProductsCsv(csv: string, writeIssue?: ImportIssueWriter): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const document = parseCsvDocument(csv);
    const rows = document.records;
    const invalidHeaders = invalidCsvHeaders(
      document.headers,
      rows.length,
      ["name", "brand", "category", "skintypesource"],
      "products",
      startedAt,
    );
    if (invalidHeaders) return persistHeaderIssue(invalidHeaders, document, writeIssue);
    if (rows.length === 0) return emptyCsvResult("products", document, startedAt, writeIssue);
    const errors: CsvRowError[] = [];
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let warnings = 0;
    let partialSuccess = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const record = rows[i];
      const rowNumber = record.sourceLineStart;
      const row = record.values;
      const issueStart = errors.length;
      let rowWritten = false;
      let rowStage = "catalog";
      try {
        const name = row.name?.trim() ?? "";
        const brand = row.brand?.trim() ?? "";

        if (!isScraperRowSuccessful(row.status)) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "SCRAPER_STATUS",
            message: "Row skipped because scraper status was not successful.",
          });
          continue;
        }

        if (!name) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "MISSING_NAME",
            message: "Row skipped because product name is missing.",
          });
          continue;
        }
        if (!brand) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "MISSING_BRAND",
            message: "Row skipped because product brand is missing.",
          });
          continue;
        }

        const category = parseCategory(row.category);
        if (!category) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "INVALID_CATEGORY",
            message: "Row skipped because product category is invalid.",
          });
          continue;
        }

        const rawSkinTypeSource = row.skintypesource?.trim().toLowerCase();
        if (
          rawSkinTypeSource !== "inferred" &&
          rawSkinTypeSource !== "manual"
        ) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "INVALID_SKIN_TYPE_SOURCE",
            message: 'Row skipped because skinTypeSource must be provided as "inferred" or "manual".',
          });
          continue;
        }
        const incomingSkinTypeSource = rawSkinTypeSource as ProductSkinTypeSource;

        const labels = parseLabels(row.labels);
        const skinType = parseSkinTypes(row.skintype);
        const country = row.country?.trim() || "";
        const capacity = row.capacity?.trim() || "0ml";
        const parsedPrice = parseScraperPrice(row.price);
        if (parsedPrice === undefined) {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "INVALID_PRICE",
            message: "Row skipped because the product price was malformed.",
          });
          continue;
        }
        const price = parsedPrice === -1 ? 0 : parsedPrice;
        const instructions = parseInstructions(row.instructions);
        const ingredients = row.ingredients?.trim() || null;
        const imageUrls = parseImageUrls(row.imageurls);
        const averageRating = Number(row.averagerating || 0);
        const storeUrl = row.url?.trim() || "";
        const merchantName = parseMerchantName(row.merchant);

        processed += 1;

        try {
          const existing = await this.productRepository.findModelByNameAndBrand(
            name,
            brand,
          );

          let productId: number;

          if (existing) {
            const previousCategory = existing.getDataValue(
              "category",
            ) as ProductCategory;
            await this.productRepository.updateImportedProduct(existing, {
              category,
              labels,
              skinType,
              skinTypeSource: incomingSkinTypeSource,
              capacity,
              country,
              instructions,
              ingredients,
              imageUrls,
              averageRating,
            });
            rowWritten = true;
            productId = Number(existing.getDataValue("id"));
            updated += 1;
            if (category !== previousCategory) {
              rowStage = "routine_category_sync";
              await this.routineProductRepository.updateCategoryForProduct(
                productId,
                category,
              );
            }
          } else {
            const createdProduct = await this.productRepository.createImportedProduct({
              name,
              brand,
              category,
              labels,
              skinType,
              skinTypeSource: incomingSkinTypeSource,
              country,
              capacity,
              price,
              instructions,
              ingredients,
              imageUrls,
              averageRating,
              reviewCount: 0,
            });
            rowWritten = true;
            productId = Number(createdProduct.getDataValue("id"));
            created += 1;
          }

          if (storeUrl && (price > 0 || parsedPrice === -1)) {
            rowStage = "merchant_offer";
            const merchant = await this.merchantRepository.findModelByName(merchantName);
            if (!merchant) {
              errors.push({
                row: rowNumber,
                code: "MERCHANT_NOT_FOUND",
                message: "Product saved, but its merchant offer could not be linked because the merchant was not found.",
              });
            } else {
              await this.productMerchantRepository.upsertImportedOffer({
                productId,
                merchantId: Number(merchant.getDataValue("id")),
                website: storeUrl,
                price: parsedPrice === -1 ? null : price,
                preserveExistingPrice: true,
              });
              rowStage = "price_sync";
              await this.syncProductPriceFromLowestOffer(productId);
            }
          }
        } catch (error: unknown) {
          failed += 1;
          errors.push({
            row: rowNumber,
            code: rowWritten ? "PARTIAL_ROW_FAILED" : "ROW_PROCESS_FAILED",
            message: rowWritten
              ? `Product record saved; ${rowStage} step failed: ${safeRowFailure(error)}`
              : safeRowFailure(error),
            ...(rowWritten ? { outcome: "partial_success" as const } : {}),
            ...(rowWritten ? { stage: rowStage } : {}),
          });
        }
      } finally {
        const persisted = await persistNewIssues(errors, issueStart, record, row, "products", writeIssue);
        warnings += persisted.warnings;
        partialSuccess += persisted.partialSuccess;
      }
    }

    return {
      ok: failed === 0 && skipped === 0 && warnings === 0,
      importType: "products",
      message: "CSV product import completed",
      totals: {
        received: rows.length,
        processed,
        created,
        updated,
        skipped,
        failed,
        warnings,
        partialSuccess,
      },
      errors,
      durationMs: Date.now() - startedAt,
      processed,
      created,
      updated,
      skipped,
    };
  }

  // Link reviewed merchant master rows to products already in the catalog.
  async importMerchantOffersCsv(csv: string, writeIssue?: ImportIssueWriter): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const document = parseCsvDocument(csv);
    const rows = document.records;
    const invalidHeaders = invalidCsvHeaders(
      document.headers,
      rows.length,
      ["productid", "brand", "name", "merchant", "website", "price", "status"],
      "offers",
      startedAt,
    );
    if (invalidHeaders) return persistHeaderIssue(invalidHeaders, document, writeIssue);
    if (rows.length === 0) return emptyCsvResult("offers", document, startedAt, writeIssue);
    const errors: CsvRowError[] = [];
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let warnings = 0;
    let partialSuccess = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const record = rows[i];
      const rowNumber = record.sourceLineStart;
      const row = record.values;
      const issueStart = errors.length;
      let rowWritten = false;
      try {
        const productName = row.name;
        const brand = row.brand;
        const rawMerchantName = row.merchant;
        if (row.status?.toLowerCase() !== "matched") {
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "UNMATCHED_STATUS",
            message: "Row skipped because its status was not marked matched.",
          });
          continue;
        }

        const incomingPrice = parseOfferPrice(row.price);
        const merchantName = rawMerchantName?.trim().toLowerCase() === "amazon.ca"
          ? "Amazon"
          : rawMerchantName;
        const parsedStock = parseOfferStock(row.stock);
        const productId = Number(row.productid);

        if (
          !productName || !brand || !merchantName || !row.website?.trim() ||
          !Number.isInteger(productId) || productId <= 0 ||
          incomingPrice === undefined ||
          (Boolean(row.stock?.trim()) && parsedStock === undefined)
        ) {
          const invalidFields = [
            !productName && "name",
            !brand && "brand",
            !merchantName && "merchant",
            !row.website?.trim() && "website",
            (!Number.isInteger(productId) || productId <= 0) && "productId",
            incomingPrice === undefined && "price (positive amount or -1)",
            (Boolean(row.stock?.trim()) && parsedStock === undefined) && "stock (true/false or 1/0)",
          ].filter(Boolean);
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "INVALID_REQUIRED_FIELDS",
            message: `Invalid or missing fields: ${invalidFields.join(", ")}.`,
          });
          continue;
        }

        processed += 1;

        try {
          const product = await this.productRepository.findModelById(productId);
          const merchant = await this.merchantRepository.findModelByName(merchantName);

          const productMatches = product &&
            String(product.getDataValue("name")).trim().toLowerCase() === productName.trim().toLowerCase() &&
            String(product.getDataValue("brand")).trim().toLowerCase() === brand.trim().toLowerCase();
          if (!product || !merchant || !productMatches) {
            skipped += 1;
            errors.push({
              row: rowNumber,
              code: "PRODUCT_OR_MERCHANT_NOT_FOUND",
              message: !product
                ? "The product ID was not found in the catalog."
                : !merchant
                  ? "The merchant was not found."
                  : "The brand or product name does not match the supplied product ID.",
            });
            continue;
          }

          const merchantId = Number(merchant.getDataValue("id"));
          const wasCreated = await this.productMerchantRepository.upsertImportedOffer({
            productId,
            merchantId,
            website: row.website,
            price: incomingPrice,
            stock: parsedStock,
          });
          rowWritten = true;
          if (wasCreated) {
            created += 1;
          } else {
            updated += 1;
          }

          await this.syncProductPriceFromLowestOffer(productId);
        } catch (error: unknown) {
          failed += 1;
          errors.push({
            row: rowNumber,
            code: rowWritten ? "PARTIAL_ROW_FAILED" : "ROW_PROCESS_FAILED",
            message: rowWritten
              ? `Merchant offer saved; product price sync failed: ${safeRowFailure(error)}`
              : safeRowFailure(error),
            ...(rowWritten ? { outcome: "partial_success" as const, stage: "price_sync" } : {}),
          });
        }
      } finally {
        const persisted = await persistNewIssues(errors, issueStart, record, row, "offers", writeIssue);
        warnings += persisted.warnings;
        partialSuccess += persisted.partialSuccess;
      }
    }

    return {
      ok: failed === 0 && skipped === 0 && warnings === 0,
      importType: "offers",
      message: "CSV merchant offer import completed",
      totals: {
        received: rows.length,
        processed,
        created,
        updated,
        skipped,
        failed,
        warnings,
        partialSuccess,
      },
      errors,
      durationMs: Date.now() - startedAt,
      processed,
      created,
      updated,
      skipped,
      updatedOffers: created + updated,
    };
  }

  // Refresh prices and stock for merchant offers that already have a link.
  async importPriceUpdatesCsv(csv: string, writeIssue?: ImportIssueWriter): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const document = parseCsvDocument(csv);
    const rows = document.records;
    const invalidHeaders = invalidCsvHeaders(
      document.headers,
      rows.length,
      ["brand", "name", "price", "merchant", "stock"],
      "prices",
      startedAt,
    );
    if (invalidHeaders) return persistHeaderIssue(invalidHeaders, document, writeIssue);
    if (rows.length === 0) return emptyCsvResult("prices", document, startedAt, writeIssue);

    const errors: CsvRowError[] = [];
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let warnings = 0;
    let partialSuccess = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const record = rows[i];
      const rowNumber = record.sourceLineStart;
      const row = record.values;
      const issueStart = errors.length;
      let rowWritten = false;
      try {
        const productName = row.name?.trim();
        const brand = row.brand?.trim();
        const merchantName = row.merchant?.trim().toLowerCase() === "amazon.ca"
          ? "Amazon"
          : row.merchant?.trim();
        const price = parseOfferPrice(row.price);
        const stock = parseOfferStock(row.stock);

        if (
          "productid" in row || "status" in row || !productName || !brand ||
          !merchantName || price === undefined || stock === undefined
        ) {
          const invalidFields = [
            !productName && "name",
            !brand && "brand",
            !merchantName && "merchant",
            price === undefined && "price (positive amount or -1)",
            stock === undefined && "stock (true/false or 1/0)",
          ].filter(Boolean);
          skipped += 1;
          errors.push({
            row: rowNumber,
            code: "INVALID_REFRESH_ROW",
            message: "productid" in row || "status" in row
              ? "Price refresh files must not include productId or status columns. Use the merchant offer import for reviewed master files."
              : `Invalid or missing fields: ${invalidFields.join(", ")}.`,
          });
          continue;
        }

        processed += 1;
        try {
          const product = await this.productRepository.findModelByNameAndBrand(
            productName,
            brand,
          );
          const merchant = await this.merchantRepository.findModelByName(merchantName);
          if (!product || !merchant) {
            skipped += 1;
            errors.push({
              row: rowNumber,
              code: "PRODUCT_OR_MERCHANT_NOT_FOUND",
              message: !product
                ? "The product brand and name were not found in the catalog."
                : "The merchant was not found.",
            });
            continue;
          }

          const productId = Number(product.getDataValue("id"));
          const merchantId = Number(merchant.getDataValue("id"));
          const offerFound = await this.productMerchantRepository.refreshImportedPrice({
            productId,
            merchantId,
            price,
            stock,
          });
          if (!offerFound) {
            skipped += 1;
            errors.push({
              row: rowNumber,
              code: "OFFER_NOT_FOUND",
              message: "Row skipped because this product has no offer for that merchant.",
            });
            continue;
          }

          rowWritten = true;
          updated += 1;
          await this.syncProductPriceFromLowestOffer(productId);
        } catch (error: unknown) {
          failed += 1;
          errors.push({
            row: rowNumber,
            code: rowWritten ? "PARTIAL_ROW_FAILED" : "ROW_PROCESS_FAILED",
            message: rowWritten
              ? `Offer refreshed; product price sync failed: ${safeRowFailure(error)}`
              : safeRowFailure(error),
            ...(rowWritten ? { outcome: "partial_success" as const, stage: "price_sync" } : {}),
          });
        }
      } finally {
        const persisted = await persistNewIssues(errors, issueStart, record, row, "prices", writeIssue);
        warnings += persisted.warnings;
        partialSuccess += persisted.partialSuccess;
      }
    }

    return {
      ok: failed === 0 && skipped === 0 && warnings === 0,
      importType: "prices",
      message: "CSV price refresh completed",
      totals: {
        received: rows.length,
        processed,
        created: 0,
        updated,
        skipped,
        failed,
        warnings,
        partialSuccess,
      },
      errors,
      durationMs: Date.now() - startedAt,
      processed,
      created: 0,
      updated,
      skipped,
      updatedOffers: updated,
    };
  }

  private async syncProductPriceFromLowestOffer(productId: number): Promise<void> {
    const lowestPrice =
      await this.productMerchantRepository.getLowestPriceByProductId(productId);
    if (lowestPrice != null) {
      await this.productRepository.updatePrice(productId, lowestPrice);
    }
  }
}
