# Routine builder & community guides

Routines are the core domain object: a named collection of products in skincare step order, optionally tagged by skin type and shared publicly as a **guide**.

## Data model

```
User 1──* Routine *──* Product
              │
              └── RoutineProduct (join: order, notes, snapshot fields)
```

- **`Routine`** — `name`, `description` (often JSON notes), `userId`, `skinTypeTags[]`.
- **`RoutineProduct`** — links a product into a routine; prices can be resolved live via merchant offers when viewing.
- **`featured_routines`** — admin-curated subset surfaced on the home page (`FeaturedRoutine` model).

Deleting a user cascades to their routines.

## Routine builder (client-first)

**Route:** `/builder` (`frontend/src/app/(main)/builder/page.tsx`)

The builder is primarily **client-side** until the user saves:

| Concern | Implementation |
|---------|----------------|
| Slot layout | Fixed categories: cleanser, toner, essence, serum, eyecare, moisturizer, sunscreen, other |
| Persistence (draft) | `localStorage` key `builder-routine` via `useBuilderRoutine` |
| Notes | `useBuilderNotes` — per-step notes, also local until save |
| Merchant preview | Reuses recent catalog offers; fetches missing/expired offers in batches, then selects the lowest `product_merchant` price |
| Save | Requires login; opens `SaveRoutineModal`, then `POST /api/routines` + bulk product attach |

Skin type tags on save use `RoutineSkinTypeTagPicker` and are stored on the routine record.

After save, users get a shareable URL: `/routine/[id]`.

### Builder hook API (`useBuilderRoutine`)

- `addProductToSlot(category, product)` — supports multiple products per slot (migrated from older single-product shape).
- `removeProductFromSlot`, `clearRoutine`
- Auto-save to `localStorage` after hydration

The builder shares the catalog's browser offer cache (60 seconds, at most 200 products). Adding a recently priced catalog product normally needs no additional offer request. Existing draft prices, merchant details, and images survive failed lookups; 429 responses show a retry countdown and block new uncached offer requests during the shared cooldown. A successful empty offer result is distinct from a failure and clears an unavailable price. Restoring an existing local draft does not automatically refresh all its prices. Images are carried with the product separately from merchant lookups.

## Viewing a routine

**Route:** `/routine/[id]`

Server/client code loads:

- `GET /api/routines/id/:id` — routine metadata
- `GET /api/routines/id/:id/products` — products in the routine
- Batched merchant offers via `getMerchantOffersByProductIds` (6h revalidate on server fetches)

Displayed prices favor the **lowest merchant offer** per product (`pickLowestPriceOffer`), consistent with the builder.

## Community guides

**Route:** `/routines`

Public, read-only listing of routines from **registered** authors (server-filtered).

**API:** `GET /api/routines/guides`

Query params (see `GuidesFilters`):

- `tags` — skin type filter (parsed via `routineSkinTypeTags`)
- `minPrice` / `maxPrice` — lower/upper bounds on routine total
- `limit` / `offset` — pagination (24 per page in UI)

The endpoint returns `{ routines, total }`, where `total` counts registered-author routines matching the same skin-type and price filters, independent of the requested offset. Results are ordered newest first, with routine ID as a tie-breaker so unchanged results stay consistent across pages. Limits and offsets must be safe integers; limits are bounded to 1–50 and offsets must be nonnegative.

The response envelope replaces the previous bare array, so the API and frontend must be deployed together. No database migration is required.

The listing uses numbered URL pages, omits `page=1`, preserves filters, and redirects requests beyond the last page to a valid page. Changing filters resets to page 1. Failed requests show an error and retry action rather than an empty-results message.

Pagination shares the Products design: 44px minimum touch targets, up to three nearby page numbers and arrow controls on phones, and first/last pages with ellipses on larger screens. Navigation shows visible loading feedback and blocks duplicate page requests. Successful user-initiated page changes focus and scroll to the results heading below the fixed header; initial loads, filter edits, and browser history navigation keep their existing behavior.

## Featured routines (home)

**API:** `GET /api/routines/featured` (public)

**Admin:** `GET/POST/DELETE /api/routines/admin/featured/:id`

Admins curate featured guides at `/admin/content` (`ContentGuidesClient`), with a cap enforced in the UI (`FEATURED_CAP`).

## Authenticated user routines

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/routines/me` | Yes | Current user's routines |
| `GET /api/routines/user/:userId` | Yes | Specific user (owner-oriented) |
| `POST /api/routines` | Yes | Create routine |
| `POST /api/routines/bulk` | Yes | Attach many products at once |
| `PUT /api/routines/id/:id` | Yes | Update metadata |
| `DELETE /api/routines/id/:id` | Yes | Delete |
| `POST /api/routines/id/:id/products` | Yes | Add product to routine |
| `PUT/DELETE /api/routines/products/:id` | Yes | Update/remove join row |

Routine creation is rate-limited (10 per hour per IP) to reduce abuse. Routine creation and merchant creation share this fixed-window budget. Routine updates and deletes allow 60 requests per IP per 15 minutes.

## Profile pages

Under `/profile/`:

- **Saved routines** — bookmarks/favorites (UI layer; confirm against current API usage in `saved-routines/page.tsx`)
- **Created routines** — lists routines owned by the signed-in user

## Design notes

- **Live vs copied pricing:** Routines reference product IDs; merchant prices are fetched at read time so offer changes propagate without duplicating catalog rows.
- **Live category:** Display and slot grouping use `products.category` from the join (see `effectiveRoutineProductCategory`). `routine_products.category` is a denormalized snapshot kept in sync on save/attach and when catalog category changes (CSV / product update). Builder `localStorage` drafts are temporary and are not auto-migrated.
- **Bulk attach:** Preferred over many single-product POSTs when saving from the builder.
- **Comments:** A `Comment` model exists in the codebase but is not wired into the main guides flow yet.

## Related files

| Area | Path |
|------|------|
| API service | `backend/src/services/RoutineService.ts` |
| Routes | `backend/src/routes/routineRoutes.ts` |
| Frontend API | `frontend/src/lib/routines.ts` |
| Types | `frontend/src/types/routine.ts`, `backend/src/types/routine.ts` |
| Module doc | `backend/docs/modules/routine.md` |
