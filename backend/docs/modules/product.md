# Product Module (Backend)

The **products** module is the core domain for the skincare inventory system. It aggregates product data and manages pricing relationships across various external vendors.The module follows a strict Controller-Service-Repository architecture.

## Data Models

The product domain uses a relational PostgreSQL schema and constructed by two primary models:

- Products (`product.ts`): Holds standard information of a product.
- A Product's Merchants (`productMerchant.ts`): A junction model managing the many to many relationship between products and merchants, this allows a single product to be linked to multiple storefronts to track varying prices and external URLs.

## Repositories

The **repository layer** handles database transactions directly, allowing seperation of logic along with security (from sql injection).

To support high volume production data, all large response queries implement **pagination**, ensuring when there is a query the database in small, efficient chunks rather than loading large datasets into memory.

The controller validates catalog pagination through `lib/productPagination.ts` before calling services: default limit 25 and offset 0, maximum limit 100, and nonnegative safe-integer offsets. Invalid or repeated pagination parameters return 400. Product and merchant directory GET/HEAD endpoints share the `catalog` IP token bucket (burst 20, refill 2/sec), separate from auth and mutation budgets. App policies live in `src/config/rateLimitPolicies.ts` and require redeployment to tune. See [rate limiting](../../../docs/backend-architecture.md#5-rate-limiting-summary) for deployment limits.

`GET /api/products/merchants/batch` accepts at most 40 comma-separated positive safe-integer IDs. It rejects malformed or repeated query parameters and checks the supplied count before deduplication; the repository fetches offers for the batch in one query. Missing or empty `ids` returns `{}`. One uncached 40-product catalog page therefore needs one offer batch, and the browser can reuse those offers in the builder for 60 seconds.

- Product Repository (`ProductRepository.ts`): Executes CRUD operations for products. It also contains complex queries for category filtering and search functionality.
- A Product's Merchant Repository (`ProductMerchantRepository.ts`): Handles database operations specific to merchant links, including updating prices and external vendor URLs for specific products.

The three admin CSV flows have separate responsibilities. Product initialization creates or updates catalog fields from successful rows, matching existing products by brand and name. Reimports replace catalog fields and require `skinTypeSource` to be `inferred` or `manual`; blank optional catalog fields clear stored values. The CSV may link the initial merchant from `url` and `merchant` when the price is positive or the `-1` no-price sentinel, while existing offer prices and stock remain protected. Merchant offer import accepts matched reviewed master rows, validates `productId` against brand/name, resolves an existing merchant (`Amazon.ca` maps to `Amazon`), and upserts the offer link and price. Price refresh accepts `brand,name,price,merchant,stock` and updates only an existing offer without changing its link. Price parsers strip only recognized leading currency prefixes (`$`, `CA`, `CA$`, `CAD`), preserve signs, and reject malformed numeric values. The scraper sentinel `price=-1` is stored as null and excluded from lowest-price calculations.

## Type Definitions

To enforce strict type safety and prevent repetitive inline object declarations, this file contains the core interfaces and Data Transfer Objects (DTOs) used across the module. This helps negate code smells (like repeated code in the repository or service).

- Product Types (`products.ts`): Defines the base entity shapes, category enums, and types utilized for object creation and object updates.
  - Note on **Skin Types**: The current implementation includes strict skin type typings. However, this pattern requires a rework soon, as real-world merchant websites do not consistently format or categorize products by skin type in a standardized way.
  - Same with **tags**.
- CSV Analyzer (`csv.ts`): defines a data transfer object from CSV into the system.

## Product Services

The service layer contains the core business logic, acting as the bridge between the controllers and the database repositories.

- `ProductService.ts`: Product and merchant-offer CRUD, plus paginated catalog search.
- `ProductImportService.ts`: Admin CSV imports (products, merchant offers, price refresh). Result helpers live in `lib/csvImportResults.ts`; field/document parsing stays in `lib/csvProductImport.ts`.
- `ImportReportService.ts`: Persists import runs and row-level issues around those import flows.
- `ImportProcessorService.ts`: Runs accepted imports sequentially in the API background and drains active work during shutdown.
- `ImportJobService.ts` and `ImportJobRepository.ts`: Admin-only queued CSV submissions, source payload persistence, idempotency, progress status, and single-worker claims.

### Queued CSV imports

CSV endpoints enqueue the exact decoded UTF-8 source text and retained report row in one database transaction. Submission keys are scoped to the submitting account; reusing a key with a different import type or content returns HTTP 409. History/detail reads expose job status and provisional counters but never return the stored CSV payload.

The API initializes `ImportProcessorService` after migrations and triggers background processing when an upload is accepted. Imports run sequentially without an idle polling loop or a separate command. Startup marks unfinished jobs `needs_review` rather than replaying them. SIGINT/SIGTERM stops new submissions and lets the active import finish before closing the database. This assumes one API instance. See [the data import pipeline](../../../docs/dataimport.md).

Each imported catalog mutation locks and validates the owning attempt before committing, and renews its heartbeat. Progress checkpoints advance after a source record's issues have been persisted. A stale heartbeat is fenced and moved to `needs_review`; jobs are never automatically replayed. Since domain mutations, issue persistence, and progress are separately committed, interruption can leave partial changes for the last uncheckpointed row. Review the incomplete report and catalog state before taking any manual action. After reviewing partial results and any newer catalog edits, manually submit a corrected CSV as a new import if needed; interrupted jobs are never automatically retried.

Queued CSV source text is retained in PostgreSQL with its report. No payload cleanup policy is implemented. Restrict database access and keep all job/report endpoints behind the admin guard.

## Product Controller (`productController.ts`)

The HTTP communication layer. The controller is responsible for receiving client requests, validating inputs, passing data to the ProductService, and formatting the final HTTP responses. It contains no important business logic, validating that the internal data structures are not leaked to the client.

## Product Routes (`productRoutes.ts`)

Product routes hold all the server/backend endpoints to Products.
There are all the Admin Endpoints that requireAdmin to get to them, and the rest of the endpoints are standard CRUD endpoints available to any auth.
