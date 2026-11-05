# ClearUp — Backend Architecture

> **Stack**: Node.js · Express · TypeScript · Sequelize ORM · PostgreSQL · Better Auth · AWS SES / SNS

---

## 1. Entity-Relationship (ER) Diagram

> Models live in `backend/src/models/`. Associations are wired in `backend/src/associations.ts`.
> Better Auth owns `user`, `account`, `session`, and `verification` (managed via its own `pg` Pool).
> Application logic owns the remaining tables.

```mermaid
erDiagram
    %% ─────────────────────────────────────────────
    %% AUTH LAYER  (managed by Better Auth)
    %% ─────────────────────────────────────────────

    USER {
        string  id              PK
        string  name
        string  email           UK
        boolean emailVerified
        string  emailStatus     "active | bounced | complained"
        string  image
        string  role            "user | admin"
        boolean banned
        string  banReason
        date    banExpires
        date    createdAt
        date    updatedAt
    }

    ACCOUNT {
        string  id                    PK
        string  accountId
        string  providerId            "credential | google"
        string  userId                FK
        text    accessToken
        text    refreshToken
        text    idToken
        date    accessTokenExpiresAt
        date    refreshTokenExpiresAt
        string  scope
        string  password              "hashed; credentials only"
        date    createdAt
        date    updatedAt
    }

    SESSION {
        string  id          PK
        date    expiresAt
        string  token       UK
        string  ipAddress
        string  userAgent
        string  userId      FK
        date    createdAt
        date    updatedAt
    }

    VERIFICATION {
        string  id          PK
        string  identifier  "email address"
        text    value       "signed token"
        date    expiresAt
        date    createdAt
        date    updatedAt
    }

    %% ─────────────────────────────────────────────
    %% APPLICATION LAYER
    %% ─────────────────────────────────────────────

    ROUTINE {
        int     id              PK
        string  name
        text    description     "user notes; JSON-safe"
        string  userId          FK
        string[]  skinTypeTags  "oily | dry | combo | sensitive | normal | acne-prone"
        date    createdAt
        date    updatedAt
    }

    PRODUCT {
        int     id              PK
        string  name
        string  brand
        string  category        "ENUM from productCategories"
        string[]  labels
        string[]  skinType      "GIN-indexed array"
        string  country
        string  capacity
        float   price
        text[]  instructions
        string  activeIngredient
        text    ingredients
        text[]  imageUrls
        float   averageRating
        int     reviewCount
        string[]  tags
    }

    ROUTINE_PRODUCT {
        int     id              PK "join table"
        int     routineId       FK
        int     productId       FK
        string  category        "ENUM — denormalized; display uses products.category"
        text    amNote          "AM usage note"
        text    pmNote          "PM usage note"
        int     amStepOrder
        int     pmStepOrder
        date    createdAt
        date    updatedAt
    }

    MERCHANT {
        int     id      PK
        string  name
        string  logo
    }

    PRODUCT_MERCHANT {
        int     id          PK
        int     productId   FK
        int     merchantId  FK
        string  website     "buy link"
        float   price       "merchant-specific price; nullable when unavailable"
        boolean stock
        string  shipping
        date    lastUpdated
    }

    FEATURED_ROUTINE {
        int     id          PK
        int     routineId   FK  UK
        string  pinnedBy    "admin userId"
        date    createdAt
        date    updatedAt
    }

    COMMENT {
        int     id           PK  "schema only — not yet wired"
        int     productId    FK
        string  userId       FK
        string  content
        int     helpfulCount
        date    createdAt
    }

    %% ─────────────────────────────────────────────
    %% RELATIONSHIPS
    %% ─────────────────────────────────────────────

    %% Auth relations (CASCADE on delete)
    USER         ||--o{  ACCOUNT          : "has many (CASCADE)"
    USER         ||--o{  SESSION          : "has many (CASCADE)"

    %% Core app relations (CASCADE on delete)
    USER         ||--o{  ROUTINE          : "has many (CASCADE)"
    ROUTINE      ||--o{  ROUTINE_PRODUCT  : "has many (CASCADE)"
    PRODUCT      ||--o{  ROUTINE_PRODUCT  : "used in"
    ROUTINE      }o--o{  PRODUCT          : "belongsToMany via ROUTINE_PRODUCT"

    %% Merchant relations
    PRODUCT      ||--o{  PRODUCT_MERCHANT : "sold at"
    MERCHANT     ||--o{  PRODUCT_MERCHANT : "sells"
    PRODUCT      }o--o{  MERCHANT         : "belongsToMany via PRODUCT_MERCHANT"

    %% Admin curation
    ROUTINE      ||--o|  FEATURED_ROUTINE : "featured by admin"

    %% Future — product reviews
    PRODUCT      ||--o{  COMMENT          : "receives (planned)"
    USER         ||--o{  COMMENT          : "writes (planned)"
```

---

## 2. Request Lifecycle Flowchart

> Traces a request from the client through every layer down to the database and external services.
> The auth sub-flow (Better Auth) is shown as its own path.

```mermaid
flowchart TD
    CLIENT(["🌐 Client\n(Next.js Frontend)"])

    subgraph INFRA ["Infrastructure / Edge"]
        REQLOG["Request Logger\nrequest ID + structured completion log"]
        CORS["CORS Check\ntrustedOrigins whitelist"]
        RATELIMIT["Rate Limits\nCatalog: IP bucket, burst 20 + refill 2/sec\nOther routes: 300 req / 15 min"]
        COMPRESS["Gzip Compression\nlevel 6 · threshold 1 KB"]
    end

    subgraph AUTH_PATH ["Auth Path  /api/auth/"]
        ARLIMIT["Auth Route Limiter\n120 req / 15 min"]
        BFLIMIT["Brute-Force Limiter\n15 req / 15 min on sign-in paths"]
        AUDIT["Audit Logger\nlogs sign-in · sign-out · verify"]
        BETTERAUTH["Better Auth\nbetterAuth config"]
        BA_PG[("PostgreSQL\nvia pg.Pool\nuser · account · session · verification")]
        GOOGLE_OAUTH["Google OAuth 2.0\nclientId + clientSecret"]
        SES_EMAIL["AWS SES v2\nverification and password reset emails"]
        SNS_WEBHOOK["AWS SNS Webhook\n/api/webhooks/aws-ses\nbounce and complaint events"]
    end

    subgraph APP_PATH ["Application API Paths"]
        direction TB

        subgraph MW ["Middleware Layer"]
            REQAUTH["requireAuth\ngetSession via Better Auth then DB hydrate\napplyAdminWhitelist"]
            REQADMIN["requireAdmin\nenforces role === admin"]
            MUTHEAD["requireMutationHeader\nCSRF-style header check"]
            CSVPARSE["parseCsvBody\nmultipart CSV parser"]
        end

        subgraph ROUTES ["Route Layer  Express Router"]
            R_PRODUCTS["/api/products"]
            R_ROUTINES["/api/routines"]
            R_MERCHANTS["/api/merchant"]
            R_USERS["/api/users"]
        end

        subgraph CONTROLLERS ["Controller Layer"]
            C_PRODUCT["ProductController"]
            C_ROUTINE["RoutineController"]
            C_MERCHANT["MerchantController"]
            C_USER["UserController"]
        end

        subgraph SERVICES ["Service Layer"]
            S_PRODUCT["ProductService\nfilter · import CSV · merchant mgmt"]
            S_ROUTINE["RoutineService\nbulk ops · notes · ordering"]
            S_MERCHANT["MerchantService"]
        end

        subgraph REPOS ["Repository Layer"]
            RP_PRODUCT["ProductRepository"]
            RP_ROUTINE["RoutineRepository"]
            RP_ROUTPROD["RoutineProductRepository"]
            RP_PRODMERCH["ProductMerchantRepository"]
            RP_MERCHANT["MerchantRepository"]
            RP_USER["UserRepository"]
            RP_COMMENT["CommentRepository planned"]
        end
    end

    subgraph DB ["Database Layer PostgreSQL via Sequelize ORM"]
        ORM["Sequelize\nGIN indexes on skinType\ncomposite unique on routine_products"]
        PG[("PostgreSQL\nproducts · routines · routine_products\nmerchants · product_merchants\nfeatured_routines")]
    end

    %% Request entry
    CLIENT -->|"HTTPS request"| REQLOG
    REQLOG --> CORS
    CORS   --> RATELIMIT
    RATELIMIT --> COMPRESS

    %% Auth sub-path
    COMPRESS -->|"POST /api/auth/"| ARLIMIT
    ARLIMIT  --> BFLIMIT
    BFLIMIT  --> AUDIT
    AUDIT    --> BETTERAUTH
    BETTERAUTH <-->|"session · token · user rows"| BA_PG
    BETTERAUTH <-->|"OAuth flow"| GOOGLE_OAUTH
    BETTERAUTH -->|"sendVerificationEmail\nsendResetPassword"| SES_EMAIL

    %% Webhook sub-path bypasses global limiter
    CLIENT -->|"POST /api/webhooks/aws-ses\nSNS notification"| SNS_WEBHOOK
    SNS_WEBHOOK -->|"UPDATE user.emailStatus"| ORM

    %% App sub-path
    COMPRESS -->|"GET /api/products\nGET /api/routines etc."| MW

    MW --> REQAUTH
    MW --> REQADMIN
    MW --> MUTHEAD
    MW --> CSVPARSE

    REQAUTH  -->|"valid session"| ROUTES
    REQADMIN -->|"role === admin"| ROUTES
    MUTHEAD  --> ROUTES
    CSVPARSE --> ROUTES

    ROUTES --> R_PRODUCTS
    ROUTES --> R_ROUTINES
    ROUTES --> R_MERCHANTS
    ROUTES --> R_USERS

    R_PRODUCTS  --> C_PRODUCT
    R_ROUTINES  --> C_ROUTINE
    R_MERCHANTS --> C_MERCHANT
    R_USERS     --> C_USER

    C_PRODUCT  --> S_PRODUCT
    C_ROUTINE  --> S_ROUTINE
    C_MERCHANT --> S_MERCHANT

    S_PRODUCT  --> RP_PRODUCT
    S_PRODUCT  --> RP_PRODMERCH
    S_ROUTINE  --> RP_ROUTINE
    S_ROUTINE  --> RP_ROUTPROD
    S_MERCHANT --> RP_MERCHANT
    C_USER     --> RP_USER

    RP_PRODUCT   --> ORM
    RP_ROUTINE   --> ORM
    RP_ROUTPROD  --> ORM
    RP_PRODMERCH --> ORM
    RP_MERCHANT  --> ORM
    RP_USER      --> ORM
    RP_COMMENT   -.->|"planned"| ORM

    ORM <--> PG

    %% Response path
    PG -->|"data rows"| ORM
    ORM -->|"Sequelize model instances"| REPOS
    REPOS -->|"plain objects / DTOs"| SERVICES
    SERVICES -->|"business result"| CONTROLLERS
    CONTROLLERS -->|"JSON response"| CLIENT
```

---

## 3. Component Summary

| Layer | Files | Responsibility |
|---|---|---|
| **Entry** | `src/index.ts` | Express app bootstrap, middleware wiring, route mounting, DB sync + migrations |
| **Config** | `src/config/auth.ts` | Better Auth instance — Google OAuth, email/password, admin plugin, SES hooks |
| **Config** | `src/db.ts` | Sequelize instance pointing at PostgreSQL (local Docker or cloud via `DATABASE_URL`) |
| **Models** | `src/models/*.ts` | Sequelize model classes — schema source of truth |
| **Associations** | `src/associations.ts` | FK constraints + Sequelize `hasMany` / `belongsToMany` wiring |
| **Middleware** | `src/middleware/requireAuth.ts` | `requireAuth` + `requireAdmin` — session validation, admin whitelist hydration |
| **Middleware** | `src/middleware/requestLogger.ts` | Request ID and structured request completion logging; runs before CORS and route middleware |
| **Lib** | `src/lib/logger.ts` | Pino configuration, redaction, safe error serialization, and application error reporting |
| **Middleware** | `src/middleware/rateLimits.ts` | App IP token buckets and fixed-window limits, plus global IP rate limit |
| **Lib** | `src/lib/tokenBucket.ts` | Bounded process-local token buckets with continuous refill and idle cleanup |
| **Config / lib** | `src/config/rateLimitPolicies.ts`, `src/lib/requestRateLimitPolicy.ts` | Central policy values and method/path classification for app bucket dispatch |
| **Middleware** | `src/middleware/security.ts` | Auth route rate limiting, brute-force limiter, audit logger |
| **Middleware** | `src/middleware/parseCsvBody.ts` | Multipart CSV parser for admin product import |
| **Middleware** | `src/middleware/requireMutationHeader.ts` | CSRF-style header check on mutation routes |
| **Routes** | `src/routes/*.ts` | URL-to-handler mapping; applies per-route middleware (auth guards, rate limits) |
| **Controllers** | `src/controllers/*.ts` | HTTP request/response handling; delegates to services |
| **Services** | `src/services/*.ts` | Business logic: product filtering, CSV import, routine bulk ops, notes ordering |
| **Repositories** | `src/repositories/*.ts` | Direct Sequelize queries; abstraction boundary between services and ORM |
| **Lib** | `src/lib/sesEmail.ts` | AWS SES v2 transactional email sender (respects `emailStatus`) |
| **Lib** | `src/lib/dbConfig.ts` | DB URL + SSL resolution for local vs. cloud environments |
| **Webhooks** | `src/routes/webhookRoutes.ts` | AWS SNS webhook — confirms subscription, handles bounce/complaint to update `emailStatus` |

See [Backend logging](backend-logging.md) for log fields, event categories, retention expectations, and approximate volume.

---

## 4. External Service Integrations

| Service | Purpose | Direction |
|---|---|---|
| **AWS SES v2** | Transactional email (verification, password reset) | Outbound |
| **AWS SNS** | Bounce & complaint notifications → update `user.emailStatus` | Inbound webhook |
| **Google OAuth 2.0** | Social sign-in via Better Auth `socialProviders.google` | Outbound OAuth redirect |
| **PostgreSQL** | Primary data store (Docker locally; cloud in production) | Bidirectional |

---

## 5. Rate Limiting Summary

The backend configures app policies centrally in `backend/src/config/rateLimitPolicies.ts`. All app policies currently key on IP: token buckets use Express `req.ip`, normalized with `ipKeyGenerator` (IPv4 address or IPv6 /56 subnet), and fixed-window limits use the limiter's IP key. User-ID keys are not implemented. Known classified routes use one app bucket instead of the shared global bucket.

| App policy | Scope | Capacity / refill |
|---|---|---|
| `catalog` | Catalog product GET/HEAD routes and merchant directory GET/HEAD | Burst 20; 2 tokens/sec |
| `sessionReads` | Session reads, including `get-session`, `/me`, session and account lists | Burst 30; 1 token/sec |
| `login` | Email/password login | Burst 5; 1 token/100 sec |
| `recovery` | Registration, password reset, and verification flows (shared bucket) | Burst 5; 1 token/60 sec |
| `otherAuth` | Google OAuth/callback, logout, profile/account changes, and remaining enabled auth actions | Burst 20; 1 token/sec |

Unknown auth actions retain the global limiter and also use the `otherAuth` fallback. Other unmatched routes use the global IP limit (300 requests / 15 minutes). Fixed app limits remain: routine creation 10/hour and routine mutations 60/15 minutes. The existing shared 10/hour creation budget is retained. Routine and admin limits are still IP-based; user-keyed policies are not implemented.

Better Auth applies its own internal production rate limits as well. Its defaults are enabled in production and disabled in development, and can be stricter than the app bucket (for example, sign-in 3/10 seconds and email request 3/minute). Every inbound `/api/auth` HTTP request passes through the Express app policy guards before reaching Better Auth, where applicable. Direct in-process calls such as `auth.api.getSession` in `requireAuth` bypass those Express auth guards; they are still covered by the app policy for the outer API request, but do not consume an additional auth bucket. App `Retry-After` and Better Auth's exposed `X-Retry-After` may differ.

To tune a policy, edit its values in `rateLimitPolicies.ts` and redeploy. For example, changing the login burst or refill rate looks like:

```ts
login: { capacity: 5, refillPerSecond: 1 / 100, maxBuckets: 2_000 },
```

App bucket responses use 429 and expose `Retry-After` and `X-Retry-After`; known classified requests do not also consume the global bucket. Unknown auth actions use the `otherAuth` bucket and remain subject to global limiting. The AWS SES webhook remains mounted before these limiters. Auth requests are audited before app guards, with rejected attempts sanitized; rate rejections emit `rate_limit.exceeded` with the policy identifier.

The five token-bucket stores are process-local and cap at 2,000 keys each (10,000 combined); they reset on restart and do not provide shared enforcement across backend instances. Traffic triggers cleanup at most once every 30 seconds, removing buckets idle at least 60 seconds only when fully refilled. When a store is full, new keys receive 429 with a retry hint for the next cleanup; existing keys retain their balances. The key cap bounds bucket entries, not total process memory. Next.js server traffic shares its egress IP's budget. Confirm `trust proxy: 1` matches the deployment proxy chain and prevent direct untrusted access that could spoof forwarding headers. There is no Redis backing or automatic policy tuning.
