import { ProductRepository } from "../repositories/ProductRepository";
import {
  CreateProductInput,
  Product,
  ProductCategory,
  UpdateProductInput,
} from "../types/product";
import { ProductMerchantRepository } from "../repositories/ProductMerchantRepository";
import {
  parseCsvText,
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
import ProductModel from "../models/Product";
import RoutineProductModel from "../models/RoutineProduct";
import {
  Merchant,
  CreateProductMerchantInput,
  ProductMerchant,
  ProductMerchantWithDetails,
  ProductWithMerchants,
  UpdateProductMerchantInput,
} from "../types/merchant";
import { MerchantRepository } from "../repositories/MerchantRepository";
import { RoutineProductRepository } from "../repositories/RoutineProductRepository";
import { CsvImportResult, CsvRowError } from "../types/csv";
import PAGINATION from "../config/pagination";
import {
  ProductSearchFilters,
  hasProductListFilters,
} from "../lib/productFilterQuery";
import type { ProductCatalogResult } from "../types/product";

function invalidCsvHeaders(
  rows: Record<string, string>[],
  required: string[],
  importType: "offers" | "prices",
  startedAt: number,
): CsvImportResult | null {
  const missing = required.filter((column) => !(column in (rows[0] ?? {})));
  if (!missing.length) return null;
  const message = `Missing required CSV columns: ${missing.join(", ")}.`;
  return {
    ok: false,
    importType,
    message,
    totals: {
      received: rows.length,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: rows.length,
      failed: 0,
    },
    errors: [{ row: 1, code: "INVALID_HEADERS", message }],
    durationMs: Date.now() - startedAt,
    processed: 0,
    created: 0,
    updated: 0,
    skipped: rows.length,
  };
}

export class ProductService {
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

  // GET all products
  async getAllProducts(
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
  ): Promise<Product[]> {
    const result = await this.getAllProductsWithTotal(limit, offset);
    return result.products;
  }

  async getAllProductsWithTotal(
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
  ): Promise<ProductCatalogResult> {
    return this.productRepository.findAllAndTotal(limit, offset);
  }

  // GET products by category (ex. cleanser, toner)
  async getProductsByCategory(
    category: ProductCategory,
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: ProductSearchFilters,
  ): Promise<Product[]> {
    const result = await this.getProductsByCategoryWithTotal(
      category,
      limit,
      offset,
      filters,
    );
    return result.products;
  }

  async getProductsByCategoryWithTotal(
    category: ProductCategory,
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: ProductSearchFilters,
  ): Promise<ProductCatalogResult> {
    if (filters && hasProductListFilters(filters)) {
      return this.productRepository.findByCategoryWithFiltersAndTotal(
        category,
        filters,
        limit,
        offset,
      );
    }
    return this.productRepository.findByCategoryAndTotal(category, limit, offset);
  }

  async getBrandsByCategory(category: ProductCategory): Promise<string[]> {
    return this.productRepository.findDistinctBrandsByCategory(category);
  }

  async getAllBrands(): Promise<string[]> {
    return this.productRepository.findDistinctBrands();
  }

  async getProductsFiltered(
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: ProductSearchFilters,
  ): Promise<Product[]> {
    const result = await this.getProductsFilteredWithTotal(limit, offset, filters);
    return result.products;
  }

  async getProductsFilteredWithTotal(
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: ProductSearchFilters,
  ): Promise<ProductCatalogResult> {
    if (filters && hasProductListFilters(filters)) {
      return this.productRepository.findAllWithFiltersAndTotal(
        filters,
        limit,
        offset,
      );
    }
    return this.productRepository.findAllAndTotal(limit, offset);
  }

  // GET / SEARCH products by query
  async searchProducts(
    query: string,
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: Omit<ProductSearchFilters, "query">,
  ): Promise<Product[]> {
    const merged: ProductSearchFilters = { ...filters, query: query.trim() };
    if (!merged.query) {
      if (filters && hasProductListFilters(merged)) {
        return this.productRepository.searchWithFilters(merged, limit, offset);
      }
      return [];
    }
    return this.productRepository.searchWithFilters(merged, limit, offset);
  }

  // GET / SEARCH products by query within a category (+ skin types & attribute filters)
  async searchProductsInCategory(
    category: ProductCategory,
    query: string,
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: Omit<ProductSearchFilters, "query">,
  ): Promise<Product[]> {
    const result = await this.searchProductsInCategoryWithTotal(
      category,
      query,
      limit,
      offset,
      filters,
    );
    return result.products;
  }

  async searchProductsInCategoryWithTotal(
    category: ProductCategory,
    query: string,
    limit: number = PAGINATION.LIMIT,
    offset: number = PAGINATION.OFFSET,
    filters?: Omit<ProductSearchFilters, "query">,
  ): Promise<ProductCatalogResult> {
    const merged: ProductSearchFilters = {
      ...filters,
      query: query?.trim() || undefined,
    };

    if (hasProductListFilters(merged)) {
      return this.productRepository.findByCategoryWithFiltersAndTotal(
        category,
        merged,
        limit,
        offset,
      );
    }

    return this.getProductsByCategoryWithTotal(category, limit, offset);
  }

  // GET product (singlular) by Id
  async getProductById(id: string): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  // POST a single product
  async createProduct(productData: CreateProductInput): Promise<Product> {
    return this.productRepository.create(productData);
  }

  // PUT update single product by ID
  async updateProduct(
    id: number,
    updates: UpdateProductInput,
  ): Promise<Product | null> {
    const updated = await this.productRepository.update(id, updates);
    if (updated && updates.category) {
      await this.routineProductRepository.updateCategoryForProduct(
        id,
        updates.category as ProductCategory,
      );
    }
    return updated;
  }

  // DELETE product by ID
  async deleteProduct(id: number): Promise<boolean> {
    await RoutineProductModel.destroy({ where: { productId: id } });
    return this.productRepository.delete(id);
  }

  // GET all merchants for a product
  async getMerchantsByProductId(
    productId: number,
  ): Promise<ProductMerchantWithDetails[]> {
    // Check if product exists first?
    const product = await this.productRepository.findById(productId.toString());
    if (!product) {
      return [];
    }

    return this.productMerchantRepository.findByProductId(productId);
  }

  // GET current offers per product for routine/builder views
  // Lazy read: current offers per product for routine/builder views.
  // Keys every requested id (empty array when no rows).
  async getMerchantsGroupedByProductId(
    productIds: number[],
  ): Promise<Record<string, ProductMerchantWithDetails[]>> {
    const unique = [...new Set(productIds)].filter(
      (id) => Number.isFinite(id) && id > 0,
    );
    const out: Record<string, ProductMerchantWithDetails[]> = {};
    for (const id of unique) {
      out[String(id)] = [];
    }
    if (!unique.length) {
      return out;
    }
    const rows =
      await this.productMerchantRepository.findByProductIds(unique);
    for (const row of rows) {
      const key = String(row.productId);
      if (!out[key]) out[key] = [];
      out[key].push(row);
    }
    return out;
  }

  // POST new merchants for a product
  async addMerchantByProductId(
    productId: number,
    merchantData: Omit<CreateProductMerchantInput, "productId">,
  ): Promise<ProductMerchant> {
    const product = await this.productRepository.findById(productId.toString());
    if (!product) {
      throw new Error("Product not found");
    }
    const createdMerchant = await this.productMerchantRepository.create({
      productId: productId,
      ...merchantData,
    });
    await this.syncProductPriceFromLowestOffer(productId);
    return createdMerchant;
  }

  // PUT update a product-merchant info
  async updateProductMerchant(
    productMerchantId: number,
    updates: UpdateProductMerchantInput,
  ): Promise<ProductMerchant | null> {
    const updatedMerchant = await this.productMerchantRepository.update(
      productMerchantId,
      updates,
    );
    if (updatedMerchant) {
      await this.syncProductPriceFromLowestOffer(updatedMerchant.productId);
    }
    return updatedMerchant;
  }

  // DELETE a Products Merchant
  async removeMerchantFromProduct(productMerchantId: number): Promise<boolean> {
    const existingMerchant =
      await this.productMerchantRepository.findById(productMerchantId);
    if (!existingMerchant) {
      return false;
    }

    const productId = Number(existingMerchant.productId);
    const deleted = await this.productMerchantRepository.delete(productMerchantId);
    if (deleted) {
      await this.syncProductPriceFromLowestOffer(productId);
    }
    return deleted;
  }

  private async syncProductPriceFromLowestOffer(productId: number): Promise<void> {
    const lowestPrice =
      await this.productMerchantRepository.getLowestPriceByProductId(productId);
    if (lowestPrice != null) {
      await this.productRepository.updatePrice(productId, lowestPrice);
    }
  }

  // POST batch import from datascraper CSV:
  // name, brand, category, labels, skinType, country, capacity, price, instructions,
  // ingredients, imageUrls, averageRating, url, merchant, status
  async importProductsCsv(csv: string): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const rows = parseCsvText(csv);
    const errors: CsvRowError[] = [];
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2; // include header line
      const row = rows[i];
      const name = row.name?.trim() ?? "";
      const brand = row.brand?.trim() ?? "";

      if (!isScraperRowSuccessful(row.status)) {
        skipped += 1;
        errors.push({
          row: rowNumber,
          code: "SCRAPER_STATUS",
          message: `Row skipped (status=${row.status || "unknown"}).`,
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
          message: `Row skipped because category "${row.category || ""}" is invalid.`,
        });
        continue;
      }

      const labels = parseLabels(row.labels);
      const skinType = parseSkinTypes(row.skintype);
      const country = row.country?.trim() || "";
      const capacity = row.capacity?.trim() || "0ml";
      const price = parseScraperPrice(row.price);
      const instructions = parseInstructions(row.instructions);
      const ingredients = row.ingredients?.trim() || undefined;
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
          await existing.update({
            category,
            labels: labels.length ? labels : existing.getDataValue("labels"),
            skinType: skinType.length
              ? skinType
              : existing.getDataValue("skinType"),
            capacity: capacity || existing.getDataValue("capacity"),
            country: country || existing.getDataValue("country"),
            instructions: instructions.length
              ? instructions
              : existing.getDataValue("instructions"),
            ingredients:
              ingredients || existing.getDataValue("ingredients"),
            imageUrls: imageUrls.length
              ? imageUrls
              : existing.getDataValue("imageUrls"),
            averageRating:
              averageRating > 0
                ? averageRating
                : existing.getDataValue("averageRating"),
          } as any);
          productId = Number(existing.getDataValue("id"));
          updated += 1;
          if (category !== previousCategory) {
            await this.routineProductRepository.updateCategoryForProduct(
              productId,
              category,
            );
          }
        } else {
          const createdProduct = await ProductModel.create({
            name,
            brand,
            category,
            labels,
            skinType,
            country,
            capacity,
            price,
            instructions,
            ingredients,
            imageUrls,
            averageRating,
            reviewCount: 0,
          } as any);
          productId = Number(createdProduct.getDataValue("id"));
          created += 1;
        }

        if (storeUrl && price > 0) {
          const merchant = await this.merchantRepository.findModelByName(merchantName);
          if (!merchant) {
            errors.push({
              row: rowNumber,
              code: "MERCHANT_NOT_FOUND",
              message: `Product saved but merchant "${merchantName}" was not found — offer link skipped.`,
            });
          } else {
            await this.productMerchantRepository.upsertImportedOffer({
              productId,
              merchantId: Number(merchant.getDataValue("id")),
              website: storeUrl,
              price,
              preserveExistingPrice: true,
            });
            await this.syncProductPriceFromLowestOffer(productId);
          }
        }
      } catch (error: any) {
        failed += 1;
        errors.push({
          row: rowNumber,
          code: "ROW_PROCESS_FAILED",
          message: error?.message || "Failed to process row.",
        });
      }
    }

    return {
      ok: failed === 0,
      importType: "products",
      message: "CSV product import completed",
      totals: {
        received: rows.length,
        processed,
        created,
        updated,
        skipped,
        failed,
      },
      errors: errors.slice(0, 50),
      durationMs: Date.now() - startedAt,
      processed,
      created,
      updated,
      skipped,
    };
  }

  // Link reviewed merchant master rows to products already in the catalog.
  async importMerchantOffersCsv(csv: string): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const rows = parseCsvText(csv);
    const invalidHeaders = invalidCsvHeaders(
      rows,
      ["productid", "brand", "name", "merchant", "website", "price", "status"],
      "offers",
      startedAt,
    );
    if (invalidHeaders) return invalidHeaders;
    const errors: CsvRowError[] = [];
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2;
      const row = rows[i];
      const productName = row.name;
      const brand = row.brand;
      const rawMerchantName = row.merchant;
      if (row.status?.toLowerCase() !== "matched") {
        skipped += 1;
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
        skipped += 1;
        errors.push({
          row: rowNumber,
          code: "INVALID_REQUIRED_FIELDS",
          message:
            "Row skipped because product, merchant, website, or price fields were invalid.",
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
            message:
              "Row skipped because the product ID/details or merchant did not match an existing record.",
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
        if (wasCreated) {
          created += 1;
        } else {
          updated += 1;
        }

        await this.syncProductPriceFromLowestOffer(productId);
      } catch (error: any) {
        failed += 1;
        errors.push({
          row: rowNumber,
          code: "ROW_PROCESS_FAILED",
          message: error?.message || "Failed to process row.",
        });
      }
    }

    return {
      ok: failed === 0,
      importType: "offers",
      message: "CSV merchant offer import completed",
      totals: {
        received: rows.length,
        processed,
        created,
        updated,
        skipped,
        failed,
      },
      errors: errors.slice(0, 50),
      durationMs: Date.now() - startedAt,
      processed,
      created,
      updated,
      skipped,
      updatedOffers: created + updated,
    };
  }

  // Refresh prices and stock for merchant offers that already have a link.
  async importPriceUpdatesCsv(csv: string): Promise<CsvImportResult> {
    const startedAt = Date.now();
    const rows = parseCsvText(csv);
    const invalidHeaders = invalidCsvHeaders(
      rows,
      ["brand", "name", "price", "merchant", "stock"],
      "prices",
      startedAt,
    );
    if (invalidHeaders) return invalidHeaders;

    const errors: CsvRowError[] = [];
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNumber = i + 2;
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
        skipped += 1;
        errors.push({
          row: rowNumber,
          code: "INVALID_REFRESH_ROW",
          message: "Expected brand, name, price, merchant, and stock for an existing offer.",
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
            message: "Row skipped because the product or merchant was not found.",
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

        updated += 1;
        await this.syncProductPriceFromLowestOffer(productId);
      } catch (error: any) {
        failed += 1;
        errors.push({
          row: rowNumber,
          code: "ROW_PROCESS_FAILED",
          message: error?.message || "Failed to process row.",
        });
      }
    }

    return {
      ok: failed === 0,
      importType: "prices",
      message: "CSV price refresh completed",
      totals: {
        received: rows.length,
        processed,
        created: 0,
        updated,
        skipped,
        failed,
      },
      errors: errors.slice(0, 50),
      durationMs: Date.now() - startedAt,
      processed,
      created: 0,
      updated,
      skipped,
      updatedOffers: updated,
    };
  }
}
