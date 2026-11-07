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

Catalog product and merchant directory GET/HEAD routes share the `catalog` IP token bucket (burst 20, refill 2/sec). Policies are configured in `backend/src/config/rateLimitPolicies.ts`; changes require a code change and redeployment. Exhaustion returns 429 with retry timing. Next.js server traffic shares its egress IP's budget. See [rate limiting](../backend-architecture.md#5-rate-limiting-summary) for deployment and in-memory storage limitations.

Global and category listings default to `limit=25&offset=0`. Explicit limits must be integers from 1–100; offsets must be nonnegative safe integers. Malformed, repeated, or oversized pagination parameters return 400 before querying the service. Response shapes are unchanged. Merchant batches accept at most 40 comma-separated positive safe-integer product IDs (matching one catalog page). Malformed, repeated query parameters or oversized batches return 400; valid duplicate IDs are deduplicated after the size check. Missing or empty `ids` returns an empty object.

| Method | Path | Access | Purpose |
|--------|------|--------|---------|
| GET | `/` | Public | Paginated all products |
| GET | `/category/:category` | Public | Category listing |
| GET | `/id/:id` | Public | Product detail |
| GET | `/id/:id/merchants` | Public | Offers for one product |
| GET | `/merchants/batch?ids=1,2,3` | Public | Batched offers (catalog, builder, routine pages) |
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

Catalog listings use server-rendered numbered pages of 40 products. The `page` query parameter is 1-based; page 1 is omitted from canonical URLs. Repeated `page` parameters are treated as invalid and resolve to page 1, even when their values match. Search and filters remain in the URL, filter changes reset to page 1, and browser history restores the selected page and controls. Catalog failures retain the last successful rows and show a retry notice; malformed catalog payloads are treated as failures.

Products and community routines share pagination controls with 44px minimum touch targets. Phones show previous/next arrows and up to three nearby page numbers; larger screens include first/last pages and ellipses. Page changes show visible loading feedback and disable repeated pagination requests. After a successful user-initiated page change, focus and scroll move to the results heading with space for the fixed header. Initial loads, filter changes, and browser history navigation do not trigger this pagination scroll.

Filter navigation is debounced by 250 ms. Clearing a change before it is issued cancels it without navigating; clearing an issued change replaces its destination. Navigation completion follows the router transition and committed URL, allowing same-URL replacements and out-of-range page redirects to settle without leaving pagination disabled.

### Caching strategy (`frontend/src/lib/products.ts`)

Server fetches use Next.js `revalidate` tiers:

| Constant | TTL | Use |
|----------|-----|-----|
| `CATALOG_REVALIDATE_SEC` | 1h | Category lists |
| `PRODUCT_MERCHANTS_REVALIDATE_SEC` | 30m | Single-product merchants |
| `BATCH_MERCHANT_OFFERS_REVALIDATE_SEC` | 6h | Routine batch merchant fetch |
| Product-by-id (`getProductById`) | `no-store` | PDP body — always fresh after catalog edits |

This keeps catalog pages fast without stale prices living forever on high-churn offers.

Browser catalog and builder reads share `frontend/src/lib/catalogMerchantOffers.ts`: successful offers, including confirmed empty results, are cached for 60 seconds with a 200-product bound. Only missing or expired IDs are requested, in batches of 40. Cache and cooldown state are browser memory only and reset on a full reload. Product images come from the product's `imageUrls`, not this offer endpoint.

Changing catalog results aborts obsolete offer fetches. A failed batch stops further batches, retains previously displayed prices, and shows a retry notice. A 429 establishes a shared browser cooldown using `Retry-After` (or `X-Retry-After`, with a one-second fallback); uncached requests return that cooldown to the UI without queuing automatic retries. Successful cached offers remain usable during cooldown. Already accepted requests can still consume backend tokens after cancellation. These changes do not increase the shared catalog rate budget or remove the Next.js shared-egress-IP limitation.

## Admin import

The admin imports page has three CSV flows:

1. **Initialize Products** creates or updates `products` from the catalog scraper CSV. The CSV price is used for new products; reimporting an existing product preserves its current price. A row with `url` and a positive price or the `-1` no-price sentinel creates or updates the initial offer for the supplied `merchant` (blank defaults to YesStyle). A new `-1` offer keeps its URL with a null price; reimports preserve an existing offer's price and stock. The merchant must already exist. The reviewed Amazon master lacks the category required by this flow.
2. **Add Merchant Offers** accepts reviewed merchant masters with `productId,brand,name,merchant,website,price,status` (extra columns are ignored). Only `status=matched` rows import. The product ID is authoritative, and brand/name must match that product. The merchant must already exist (`Amazon.ca` maps to `Amazon`). Rows upsert `product_merchants` by product and merchant, including the website.
3. **Refresh Prices** accepts `brand,name,price,merchant,stock`. It updates only an existing offer, preserving its website; unknown products, merchants, and offers are skipped with row errors.

Offer prices may be positive plain numbers or values prefixed with `$`, `CA`, `CA$`, or `CAD`, such as `$30.23`, `CA 30.23`, `CA$ 30.23`, and `CAD 30.23`. Only a recognized leading prefix is removed; the remaining value must be numeric. The exact sentinel `-1` is stored as `NULL`. Blank, zero, and malformed prices are rejected. Refresh stock accepts `true`/`false` or `1`/`0`. A new master offer without stock defaults to false when its price is null and true when priced; existing stock is preserved when the master has no stock column.

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
