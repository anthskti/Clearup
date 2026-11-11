# Backend logging

The API uses Pino and `pino-http`. Logs are structured JSON on stdout in every environment. Each JSON line is one record. The hosting platform or process manager decides how long deployed stdout is retained; the API does not create or rotate log files. Frontend Next.js console logs are separate from these backend records.

## Configure output

Run commands from `backend/`:

```sh
bun run dev          # JSON, debug threshold by default
bun run dev:pretty   # readable local output via pino-pretty
bun run build && bun run start  # compiled API; JSON
```

`LOG_LEVEL` sets the minimum severity. The default is `debug` unless `NODE_ENV=production`, when it is `info`. `APP_ENV` labels records as `development`, `staging`, or `production`; if unset or invalid, the label follows `NODE_ENV` (`production` or `development`). Use `NODE_ENV=production` for staging and production deployments, and set `APP_ENV=staging` for the staging label.

| Level | Number | Meaning |
|---|---:|---|
| `trace` | 10 | Most detailed diagnostics |
| `debug` | 20 | Developer diagnostics |
| `info` | 30 | Normal operation and audit events |
| `warn` | 40 | Unexpected or rejected conditions that did not become an application error |
| `error` | 50 | Application errors and failed HTTP responses (500+) |
| `fatal` | 60 | Fatal conditions |
| `silent` | — | Suppress all Pino records |

The threshold filters records below the chosen level. It is not a volume cap. Raising the threshold to `warn` hides normal request completions and info events; `silent` hides everything. `debug` and `trace` are available thresholds, but the current application does not emit routine app events at those levels, so lowering the threshold does not create a verbose trace of database queries or request bodies.

## Record shape and correlation

Pino adds `time` (Unix epoch milliseconds), `level`, `service` (`clearup-api`), and `environment` to records. Request completion records also have:

- `requestId`: generated for every request and returned in the `X-Request-ID` response header.
- `req`: method, request ID, and path with the query string removed and password-reset token segments redacted.
- `res.statusCode` and `durationMs`.
- `msg`: a short human-readable summary; use `event` and other fields for filtering.

HTTP completion records currently have no `event` field; identify them by their `req` and `res` fields. Counts below refer to JSON records. `dev:pretty` may render one record across multiple terminal lines.

For example, a normal successful request is one record:

```json
{"level":30,"time":1793900000000,"service":"clearup-api","environment":"development","requestId":"a-guid","req":{"id":"a-guid","method":"GET","path":"/api/products"},"res":{"statusCode":200},"durationMs":18,"msg":"GET /api/products 200"}
```

Copy the response's `X-Request-ID` into a log search to find that request's completion and any request-scoped application error. Error message text and raw stacks are not included. A safe error can include `error.name`, a constrained `error.code`, `error.statusCode`, and up to three application locations.

Locations are normalized relative to the API's runtime root, supporting both a local checkout and Docker's `/app` directory. A source frame such as `/app/src/controllers/productController.ts:42:9` becomes `backend/src/controllers/productController.ts:42:9`; a compiled frame under `/app/dist/` becomes `backend/dist/...js:line:column`. Compiled line numbers refer to JavaScript unless the runtime maps the stack back to TypeScript. Dependency frames and paths outside the API's `src`/`dist` trees are omitted, and host directory prefixes are never included.

## Events and severity

`event` identifies a record category. The current explicit events include:

| Event / event family | Level | When it appears |
|---|---|---|
| `startup.database.connect`, `.connected`, `.sync`, `.migrations`, `.migrations_complete`, `startup.server.listening` | info | Startup stages; listening follows successful DB setup and migrations. |
| `database.config`, `database.associations.defined`, `database.migrations.none`, `database.migrations.applied` | info | Database mode, model setup, and migration result. Umzug can also emit `migrating` / `migrated` lifecycle records while migrations run. |
| `auth.bootstrap` | info | Auth configuration summary at module initialization. |
| `security.audit` with `securityEvent: "auth.route"` | info | Every `/api/auth` HTTP request on completion, including session reads, unknown paths, and failed or rate-limited responses. The status is data; failure does not change this audit record's level. |
| `security.config` | warn | Production auth URL or wildcard trusted-origin configuration warning. |
| `rate_limit.exceeded` | warn | Request blocked by an app limiter. `limiter`/`policy` identifies the policy (such as `global`, `catalog`, `sessionReads`, `login`, `recovery`, or `otherAuth`); token buckets may include `identity` and `reason`. |
| `application.error` | error | A reported application failure. `scope` describes the reporting boundary, such as `express`, `health.database`, `startup`, `auth.reset_email`, `auth.verification_email`, `auth.admin_role_persist`, or `webhook.aws_ses`. |
| `ses.email.skipped` | info | An email was skipped because the user's email status is not active. |
| `catalog_import.started`, `catalog_import.finished` | info | Import lifecycle records with `importId`, `requestId`, type and final status/counts. |
| `catalog_import.row_issue` | warn | Skipped, failed, warning or partially saved rows. Includes record/source lines, stage, code, safe reason, and bounded brand/name context. Emitted before issue persistence so a reporting write failure still leaves diagnostics. |
| `catalog_import.failed` | error | Processing stopped before the report completed; includes the import ID and sanitized exception metadata. |
| `webhook.sns.subscription.rejected`, `webhook.sns.subscription.confirmed`, `webhook.ses.bounce.processed`, `webhook.ses.complaint.processed` | warn / info | SNS subscription rejection is warn; confirmation and processed bounce/complaint notifications are info. |

HTTP completion severity is independent of application event severity: successful requests are `info`, 4xx are `warn`, and 5xx or request errors are `error`. A handled internal error normally produces an `application.error` record plus the request completion record. A 4xx auth audit stays at `info` while its separate request completion is `warn`.

Auth audit middleware runs before the app auth policy guards, so every auth HTTP request—including rejected attempts—has a sanitized audit record. A rate-limited auth request also has the rate-limit warning and completion record. Global and classified app limiters emit a warning when they reject a request; fixed routine creation and mutation limiters currently produce only the request completion record when they reject a request.

## Expected record volume

An import normally adds a start record, one warning per row issue, and a finish record to the HTTP completion record. These logs support diagnosis; the retained admin import report stores the full issue list independently of log level or stdout retention. Raw CSV, SQL and exception messages are not included in import events.

Think in HTTP requests and additional events, not browser page views. The request logger emits one completion record per request, except successful `/health` checks, which are intentionally silent. These counts assume the default `info`/`debug` threshold and no additional business events. Logs do not consume API rate-limit budget: rate limits count HTTP requests, not records. Browser screens can make several API calls; catalog list and offer lookups are separate requests, and Next.js caching can reduce the number that reach the API.

Typical counts for one API request:

| Situation | Approximate records |
|---|---:|
| Successful request | 1 completion |
| Successful `/health` | 0 |
| Failed `/health` (503) | 2: application error + completion |
| Handled 500 | 2: application error + completion |
| Audited auth path | 2: audit + completion |
| Global or classified app rate-limit rejection (429) | 2: limiter warning + completion; auth also includes audit |
| Other route-specific limit rejection | 1 completion |

For example, an uncached 40-product catalog page that makes one product-list request and one offer batch usually creates two completion records. Reusing offers from the 60-second browser cache may avoid the offer request, including when adding to the builder. An uncached brands request adds another. CORS preflight requests, auth checks, prefetches, and retries can add more API requests.

For a rough total, count request completions (excluding successful health checks), then add handled application errors, auth audits, global/catalog limit warnings, and any emitted business/startup events. A normal startup with no pending migrations is roughly ten application records; warnings and actual migration lifecycle records vary. This describes application stdout records, not any extra records created by the hosting platform.

During a temporary smoke run, 312 HTTP requests produced 312 completion records plus four global rate-limit warnings, for 316 JSON records total. `SMOKE` lines in that temporary output were test harness output, not application logs. Replacing the old console logging paths with Pino preserves application reporting in structured records; the smoke-run counts are not a normal traffic forecast.

## Redaction and safe use

The logger recursively redacts sensitive keys (case-insensitively), including passwords, tokens, authorization, cookies, secrets, email, body, headers, query, and URL. Completion request fields, completion messages, and auth audit paths use the shared `sanitizeLogPath` helper: it removes query strings and replaces password-reset token segments with `[REDACTED]`. For example, `/api/auth/reset-password/secret-token?callbackURL=...` is logged as `/api/auth/reset-password/[REDACTED]`. Mounted auth audit paths receive the same protection for `/reset-password/:token`. This only changes log output; the request URL used by authentication stays intact.

Error reporting omits raw error messages and stacks. Even with these protections, do not put credentials, personal data, request payloads, or secrets into free-form log messages or new metadata fields. Prefer a stable event name and small non-sensitive fields.

Errors are reported through `reportError`, which is the safe boundary for application error records. It currently writes to Pino; Sentry forwarding can be added there later without changing each call site.
