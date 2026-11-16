// Product DTO for application communication

import type { ProductListFilters } from "./productListFilters";

export type { ProductListFilters };

export interface Product {
  id: number;
  name: string;
  brand: string;

  category: string;
  labels: string[];
  skinType: string[];
  country: string;
  capacity: string;
  price: number;

  instructions: string[];
  activeIngredient?: string;
  ingredients?: string;
  imageUrls: string[];
  averageRating: number;
  reviewCount: number;
  tags?: string[];
}

export type ProductCategory =
  | "cleanser"
  | "toner"
  | "essence"
  | "serum"
  | "eyecare"
  | "moisturizer"
  | "sunscreen"
  | "other";

export type SkinType =
  | "oily"
  | "dry"
  | "combination"
  | "sensitive"
  | "normal"
  | "acne-prone";

export type CsvImportResponse = {
  ok: boolean;
  importId?: number;
  status?: "processing" | "completed" | "partial" | "failed";
  processed: number;
  created: number;
  updated: number;
  skipped?: number;
  updatedOffers?: number;
  message: string;
  totals?: {
    received: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    warnings?: number;
    partialSuccess?: number;
  };
  errors?: { row: number; recordNumber?: number; sourceLineStart?: number; sourceLineEnd?: number; code: string; message: string; outcome?: string; stage?: string }[];
};

export interface ProductCatalogPage {
  products: Product[];
  total: number;
}

export interface CatalogError {
  status: number | null;
  requestId: string | null;
  retryAt: number | null;
}

export interface ProductCatalogFetchOptions {
  search?: string;
  filters?: ProductListFilters;
}
