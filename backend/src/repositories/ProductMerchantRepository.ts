import { Op } from "sequelize";
import ProductMerchantModel from "../models/ProductMerchant";
import MerchantModel from "../models/Merchant";
import {
  CreateProductMerchantInput,
  ProductMerchant,
  ProductMerchantWithDetails,
  UpdateProductMerchantInput,
} from "../types/merchant";
import { withFencedImportWrite } from "./ImportJobRepository";

export class ProductMerchantRepository {
  // GET all merchants for a product
  async findByProductId(productId: number): Promise<ProductMerchantWithDetails[]> {
    const productMerchants = await ProductMerchantModel.findAll({
      where: { productId },
      include: [
        {
          model: MerchantModel,
          as: "merchant", // Must match the alias in associations.ts
          attributes: ["id", "name", "logo"],
        },
      ],
    });
    return productMerchants.map((pm: any) => this.mapToProductMerchantWithDetailsType(pm));
  }

  // GET all merchant rows for many products (single query).
  async findByProductIds(
    productIds: number[],
  ): Promise<ProductMerchantWithDetails[]> {
    if (!productIds.length) {
      return [];
    }
    const productMerchants = await ProductMerchantModel.findAll({
      where: { productId: { [Op.in]: productIds } },
      include: [
        {
          model: MerchantModel,
          as: "merchant",
          attributes: ["id", "name", "logo"],
        },
      ],
    });
    return productMerchants.map((pm: any) =>
      this.mapToProductMerchantWithDetailsType(pm),
    );
  }

  async findById(id: number): Promise<ProductMerchant | null> {
    const productMerchant = await ProductMerchantModel.findByPk(id);
    return productMerchant
      ? this.mapToProductMerchantType(productMerchant)
      : null;
  }

  async getLowestPriceByProductId(productId: number): Promise<number | null> {
    const lowestPrice = await ProductMerchantModel.min("price", {
      where: { productId, price: { [Op.ne]: null } },
    });
    return typeof lowestPrice === "number" && Number.isFinite(lowestPrice)
      ? lowestPrice
      : null;
  }

  async upsertImportedOffer(data: {
    productId: number;
    merchantId: number;
    website: string;
    price: number | null;
    stock?: boolean;
    preserveExistingPrice?: boolean;
  }): Promise<boolean> {
    return withFencedImportWrite(async (transaction) => {
    const [offer, created] = await ProductMerchantModel.findOrCreate({
      where: { productId: data.productId, merchantId: data.merchantId },
      defaults: {
        productId: data.productId,
        merchantId: data.merchantId,
        website: data.website,
        price: data.price,
        stock: data.stock ?? (data.price !== null),
        shipping: "",
        lastUpdated: new Date(),
      },
      transaction,
    });
    if (!created) {
      await offer.update({
        website: data.website,
        ...(data.preserveExistingPrice ? {} : { price: data.price }),
        ...(data.stock === undefined ? {} : { stock: data.stock }),
        lastUpdated: new Date(),
      }, { transaction });
    }
    return created;
    });
  }

  async refreshImportedPrice(data: {
    productId: number;
    merchantId: number;
    price: number | null;
    stock: boolean;
  }): Promise<boolean> {
    return withFencedImportWrite(async (transaction) => {
    const offer = await ProductMerchantModel.findOne({
      where: { productId: data.productId, merchantId: data.merchantId },
      transaction,
    });
    if (!offer) return false;
    await offer.update({
      price: data.price,
      stock: data.stock,
      lastUpdated: new Date(),
    }, { transaction });
    return true;
    });
  }

  // POST new merchant on product list
  async create(
    productMerchantData: CreateProductMerchantInput,
  ): Promise<ProductMerchant> {
    try {
      const productMerchant = await ProductMerchantModel.create(
        productMerchantData
      );
      return this.mapToProductMerchantType(productMerchant);
    } catch (error: any) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new Error("This merchant already exists in this product.");
      }
      throw error;
    }
  }

  // PUT update a product-merchant info (ex. price, stock)
  async update(
    id: number,
    updates: UpdateProductMerchantInput,
  ): Promise<ProductMerchant | null> {
    const [rows, [updatedProductMerchant]] = await ProductMerchantModel.update(
      updates,
      {
        where: { id },
        returning: true,
      }
    );
    return rows > 0
      ? this.mapToProductMerchantType(updatedProductMerchant)
      : null;
  }

  // DELETE a Products Merchant
  async delete(id: number): Promise<boolean> {
    const deleted = await ProductMerchantModel.destroy({ where: { id } });
    return deleted > 0;
  }

  private mapToProductMerchantType(dbProductMerchant: any): ProductMerchant {
    return {
      id: dbProductMerchant.id,
      productId: dbProductMerchant.productId,
      merchantId: dbProductMerchant.merchantId,
      website: dbProductMerchant.website,
      price: dbProductMerchant.price,
      stock: dbProductMerchant.stock,
      shipping: dbProductMerchant.shipping,
      lastUpdated: dbProductMerchant.lastUpdated,
    };
  }

  private mapToProductMerchantWithDetailsType(dbProductMerchant: any): ProductMerchantWithDetails {
    return {
      id: dbProductMerchant.id,
      productId: dbProductMerchant.productId,
      merchantId: dbProductMerchant.merchantId,
      website: dbProductMerchant.website,
      price: dbProductMerchant.price,
      stock: dbProductMerchant.stock,
      shipping: dbProductMerchant.shipping,
      lastUpdated: dbProductMerchant.lastUpdated,
      merchant: dbProductMerchant.merchant
        ? {
            id: dbProductMerchant.merchant.id,
            name: dbProductMerchant.merchant.name,
            logo: dbProductMerchant.merchant.logo,
          }
        : undefined,
    };
  }
}
