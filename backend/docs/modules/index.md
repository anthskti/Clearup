# Backend Entry Point Module (`index.ts`)

The backend `index.ts` file is the **application bootstrap and runtime organizer**.  
It does not contain business-domain logic; instead, it wires middleware, security controls, route modules, database startup, and server lifecycle into one execution flow.

## Core Responsibility

This file is responsible for:

- Creating and configuring the Express app instance.
- Installing structured request logging and safe error reporting before request parsers.
- Registering global middleware in the correct order.
- Mounting auth and feature routes (like product, routine, merchant).
- Has a `/health` endpoint.
- Security configuration and initializing Sequelize.
- Starting the HTTP server only after startup checks succeed.

## Middleware and Request Pipeline

The file defines a top-down request pipeline that applies protections before business routes execute:

- Pino request logging (JSON in every environment) with generated `X-Request-ID`; successful health checks are omitted.
- CORS setup using `TRUSTED_ORIGINS`, with credentials enabled.
- CORS response headers expose the request ID and rate-limit headers.
- Proxy trust (`app.set("trust proxy", 1)`) for deployment environments behind reverse proxies.
- SNS webhook text parsing, then auth audit, centralized app policy limiter, global limiter, JSON parsing, and compression. Classified catalog/auth requests use one dedicated IP bucket rather than the global bucket; unknown auth actions use both the fallback bucket and global limiter, while remaining requests retain the global 300 / 15 min limit.
- Compression middleware for response-size optimization.
- Auth audit logging runs before the app auth policy limiter so blocked requests can be audited with sanitized fields. Better Auth also applies its own production rate limits.

## Authentication Wiring

`index.ts` provides two auth integration points:

- `GET /api/auth/me`:
  - Requires authentication (`requireAuth`).
  - Returns a normalized user identity payload (`id`, `email`, `role`).
- `ALL /api/auth/*path`:
  - Delegates auth endpoints to Better Auth via `toNodeHandler(auth)`.

## Route Composition

The file mounts feature modules and applies route-level controls where needed:

- `/api/products` -> `productRoutes`
- `/api/routines` -> `routineRoutes`
- `/api/merchant` -> `merchantRoutes`

This makes `index.ts` the central place where cross-cutting concerns (rate limits, auth guards, middleware ordering) are composed with route modules.

## Startup Lifecycle (`startServer`)

The startup sequence is intentionally explicit and defensive:

1. Validate required security configuration (`validateSecurityConfig()`).
2. Authenticate database connectivity (`sequelize.authenticate()`).
3. Register model associations (`defineAssociations()`).
4. Sync models with `sequelize.sync()`.
5. Run pending Umzug migrations (`runMigrations()`).
6. Start listening on `PORT` (default `5000`).
7. On startup failure, emit a safe structured error and flush logs before exiting.

## Logging

The regular `bun run dev` command emits JSON. For local readability, `bun run dev:pretty` pipes development output through the development-only `pino-pretty` package. The deployed `start` command always emits JSON.

`LOG_LEVEL` accepts `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`. It defaults to `debug` outside production and `info` in production. `APP_ENV` may be set to `development`, `staging`, or `production` to label logs when `NODE_ENV` alone does not describe the deployment stage.

Application errors go through `reportError`, a centralized boundary that can later forward safe events to Sentry without adding an SDK now. Logs omit bodies, headers, queries, raw emails, and free-form error messages or stacks; safe application source locations may be retained. Logs go to stdout, so deployed retention and routing are handled by the hosting platform.

See [Backend logging](../../../docs/backend-logging.md) for the event catalog, severity meanings, correlation guidance, and expected record counts.
