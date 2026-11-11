import { ProductRepository } from "../repositories/ProductRepository";
import {
  CreateProductInput,
  Product,
  ProductCategory,
  UpdateProductInput,
} from "../types/product";
import { ProductMerchantRepository } from "../repositories/ProductMerchantRepository";
import RoutineProductModel from "../models/RoutineProduct";
import {
  CreateProductMerchantInput,
  ProductMerchant,
  ProductMerchantWithDetails,
  UpdateProductMerchantInput,
} from "../types/merchant";
import { RoutineProductRepository } from "../repositories/RoutineProductRepository";
import PAGINATION from "../config/pagination";
import {
  ProductSearchFilters,
  hasProductListFilters,
} from "../lib/productFilterQuery";
import type { ProductCatalogResult } from "../types/product";

export class ProductService {
  private productRepository: ProductRepository;
  private productMerchantRepository: ProductMerchantRepository;
  private routineProductRepository: RoutineProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.productMerchantRepository = new ProductMerchantRepository();
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
    const editedSkinTypes = Object.prototype.hasOwnProperty.call(
      updates,
      "skinType",
    );
    const updated = await this.productRepository.update(
      id,
      updates,
      editedSkinTypes ? { skinTypeSource: "manual" } : undefined,
    );
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
}
