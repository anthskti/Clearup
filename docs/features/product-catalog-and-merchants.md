# Product catalog & merchants

The catalog is a structured skincare inventory: each **product** has rich metadata; each product can be sold by multiple **merchants** with independent URLs and prices.

## Data model

```
Product *──* Merchant
         │
         └── ProductMerchant (price, url, merchant-specific fields)
```

### Product fields (high level)

| Field | Notes |
|-------|--------|
| `category` | Enum: `cleanser`, `toner`, `essence`, `serum`, `moisturizer`, `sunscreen`, `other` |
| `labels`, `skinType`, `tags` | String arrays for filtering and display |
| `instructions` | Text array (usage steps) |
| `price` | Base/list price on the product row |
| `imageUrls` | CDN URLs; Next.js `images.remotePatterns` allow common retailers |

### Merchant

Master list of storefronts (name, logo, base URL, etc.). Linked to products through `ProductMerchant`.

**Lowest priced offer wins** in the UI: null-priced `product_merchant` rows are excluded from price selection. A null price means unavailable; the PDP keeps the retailer link visible and reports availability as unverified.

## API

Base path: `/api/products`

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/` | Public | Paginated all products |
| GET | `/category/:category` | Public | Category listing |
| GET | `/id/:id` | Public | Product detail |
| GET | `/id/:id/merchants` | Public | Offers for one product |
| GET | `/merchants/batch?ids=1,2,3` | Public | Batched offers (routine pages) |
| POST | `/` | Admin | Create product |
| PUT/DELETE | `/id/:id` | Admin | Update/delete |
| POST | `/id/:id/merchants` | Admin | Link merchant to product |
| PUT/DELETE | `/product-merchant/:id` | Admin | Update/remove offer row |
| POST | `/admin/import/csv` | Admin | Initialize or update catalog products |
| POST | `/admin/import/offers` | Admin | Add reviewed merchant offers to existing products |
| POST | `/admin/import/prices` | Admin | Refresh prices and stock on existing offers |

Merchant CRUD: `/api/merchant` (admin for writes).

## Frontend

| Route | Behavior |
|-------|----------|
| `/products/category/[slug]` | `ProductListClient` — grid, skin-type tooltips, add-to-builder |
| `/product/id/[slug]` | `ProductClient` — gallery, ingredients, merchant table, add merchant (admin) |

### Caching strategy (`frontend/src/lib/products.ts`)

Server fetches use Next.js `revalidate` tiers:

| Constant | TTL | Use |
|----------|-----|-----|
| `CATALOG_REVALIDATE_SEC` | 1h | Category lists |
| `PRODUCT_MERCHANTS_REVALIDATE_SEC` | 30m | Single-product merchants |
| `BATCH_MERCHANT_OFFERS_REVALIDATE_SEC` | 6h | Routine batch merchant fetch |
| Product-by-id (`getProductById`) | `no-store` | PDP body — always fresh after catalog edits |

This keeps catalog pages fast without stale prices living forever on high-churn offers.

## Admin import

The admin imports page has three CSV flows:

1. **Initialize Products** creates or updates `products` from the catalog scraper CSV. The CSV price is used for new products; reimporting an existing product preserves its current price. A row with `url` and a positive price creates or updates the initial offer for the supplied `merchant` (blank defaults to YesStyle). Reimporting preserves an existing offer's price and stock. The merchant must already exist. The reviewed Amazon master lacks the category required by this flow.
2. **Add Merchant Offers** accepts reviewed merchant masters with `productId,brand,name,merchant,website,price,status` (extra columns are ignored). Only `status=matched` rows import. The product ID is authoritative, and brand/name must match that product. The merchant must already exist (`Amazon.ca` maps to `Amazon`). Rows upsert `product_merchants` by product and merchant, including the website.
3. **Refresh Prices** accepts `brand,name,price,merchant,stock`. It updates only an existing offer, preserving its website; unknown products, merchants, and offers are skipped with row errors.

Offer prices may be positive plain numbers or dollar-prefixed values such as `$30.23` and `CA$ 30.23`. The exact sentinel `-1` is stored as `NULL`. Blank, zero, and malformed prices are rejected. Refresh stock accepts `true`/`false` or `1`/`0`. A new master offer without stock defaults to false when its price is null and true when priced; existing stock is preserved when the master has no stock column.

- Backend parses CSV in `ProductService` (admin endpoints + `parseCsvBody` middleware).
- UI: `/admin/imports` (`ImportsAdminClient`) — status, manual triggers, error logs for scraper quirks.

A separate datascraper produces CSV aligned with `backend/src/types/csv.ts`. Merchant seed data also ships as `backend/src/data/merchant_table.csv` (`bun run seed:merchants`).

## Categories & skin types

Categories map to builder slots and URL slugs. Skin types (`oily`, `dry`, `combination`, `sensitive`, `normal`, `acne-prone`) appear on products and routines; routine-level tags were added in migration `001-add-routine-skin-type-tags`.

The backend module doc notes that merchant-sourced skin-type labeling may need normalization over time—treat tags as best-effort filters, not strict dermatology claims.

## Images

Product images are external URLs. `frontend/next.config.ts` whitelists hosts (CloudFront, Shopify CDNs, brand sites). Override default CDN host with `NEXT_PUBLIC_IMAGE_DOMAIN` if needed.

## Related files

| Area | Path |
|------|------|
| Product service | `backend/src/services/ProductService.ts` |
| Repositories | `ProductRepository.ts`, `ProductMerchantRepository.ts` |
| Frontend API | `frontend/src/lib/products.ts`, `lib/merchants.ts` |
| Types | `frontend/src/types/product.ts`, `merchant.ts` |
| Module doc | `backend/docs/modules/product.md` |
