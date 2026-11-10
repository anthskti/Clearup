# Admin operations

Admin features live under `/admin` on the frontend and behind `requireAdmin` on the API. Access requires a Better Auth session whose effective role is `admin` (DB role or `ADMIN_EMAILS` whitelist).

## Access control

```
Request → requireAuth → load session
                    → hydrate role from DB if needed
                    → ADMIN_EMAILS match? promote/persist admin
         → requireAdmin → 403 if role !== "admin"
```

Frontend gate: `frontend/src/app/admin/layout.tsx` redirects to `/login` or `/` before rendering admin chrome (`AdminSidebar`, `AdminHeader`).

## Admin routes (UI)

| Path | Purpose |
|------|---------|
| `/admin/dashboard` | Separate user/routine line charts with 7/30/90-day ranges, period comparisons, and lifetime totals |
| `/admin/content` | Find routines by ID/URL, preview homepage cards, and save the featured selection/order |
| `/admin/imports` | Product initialization, merchant offer import, and price refresh CSV controls |
| `/admin/users` | Searchable user directory, account details, and routine links |

## Admin API (summary)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/routines/admin/stats?days=30` | Dashboard time series and previous-period counts (integer 7–90; default 30) |
| `GET /api/routines/admin/featured` | Active featured routines in homepage order |
| `GET /api/routines/admin/featured/candidate/:id` | Preview one routine before featuring |
| `PUT /api/routines/admin/featured` | Atomically save `{ routineIds: number[] }` in display order (max 20, unique IDs) |
| `POST /api/routines/admin/featured/:id` | Feature a guide |
| `DELETE /api/routines/admin/featured/:id` | Unfeature |
| `GET /api/users/admin` | Paginated users with `search`, `role`, and `verified` filters and routine counts |
| Product POST/PUT/DELETE, `/api/products/admin/import/csv`, `/offers`, `/prices` | Catalog management and imports |
| `/api/merchant` POST/PUT/DELETE | Merchant master data |

All of the above require an admin session cookie on fetch (`credentials: "include"` in `frontend/src/lib/admin-server.ts` and routine admin helpers).

## Featured content workflow

1. Community publishes routines (saved guides).
2. Admin opens **Featured routines**, looks up an ID or routine URL, and previews the same card used on the homepage.
3. Add/remove and Move earlier/later edit a local draft (max 20). Save changes publishes the complete ordered selection; Discard edits restores the saved selection.
4. Home page `FeaturedRoutinesSection` loads `GET /api/routines/featured`. Successful editor saves invalidate the tagged frontend cache immediately.

Migration `012-featured-routine-order-active.ts` adds `position` and `isActive` to `featured_routines` and backfills the existing order. Removal marks membership inactive; rows are retained. Bulk saves and legacy add/remove calls share a PostgreSQL advisory transaction lock. A full editor save replaces the active selection atomically; concurrent full saves use the last committed selection.

## User directory

`GET /api/users/admin` accepts `limit` (1–100), `offset` (0–10,000,000), `search` (up to 100 characters), `role` (`user`/`admin`), and `verified` (`true`/`false`). Search matches ID/name/email case-insensitively; SQL LIKE metacharacters are treated literally. Results sort by creation date and ID descending, and include a routine count without separate per-user requests. Invalid parameters return 400.

The UI preserves filters in pagination URLs and opens account details without navigating away. Details include a copyable ID, full UTC creation timestamp, status, and lazily loaded routine links. Phone cards and desktop tables share the same data. The users page no longer fetches dashboard analytics. Last activity tracking remains deferred.

## Imports & catalog maintenance

The imports page is built for operational reality: scrapers hit heterogeneous retailer HTML, so imports can partially fail.

Typical flow:

1. Initialize catalog products with the product CSV, including its initial merchant link when `url`, `merchant`, and a positive price are supplied; or create products in the client. A blank merchant defaults to YesStyle.
2. Import matched rows from a reviewed merchant master to add offers to existing products.
3. Refresh prices and stock from `brand,name,price,merchant,stock` CSVs. Refreshes require an existing offer and preserve its link.
4. Review skipped and failed row counts in `ImportsAdminClient`; correct rows and re-run as needed.

`bun run seed` in development uses `sequelize.sync({ force: true })` and is **destructive**—never run against production.

## Dashboard stats

`GET /api/routines/admin/stats` returns lifetime totals, a zero-filled daily series, selected-period and preceding-period counts, and top contributors. The selected window covers completed UTC days, excluding today; repository grouping and query boundaries use UTC. Invalid day counts return 400. The API retains support for integer ranges such as 14 days for compatibility.

The dashboard defaults to 30 days and stores its 7/30/90-day selection in `?days=`. Line charts support pointer selection, arrow/Home/End keyboard inspection, and expandable daily-value tables. Phone/tablet navigation uses a drawer; desktop keeps the sidebar. Types live in `routine-admin.ts` on both frontend and backend.

## Security considerations

- Keep `ADMIN_EMAILS` minimal; prefer persisting `role: "admin"` in the database for long-term operators.
- Admin routes inherit global rate limits but are not anonymous—session required.
- CSV import endpoints require both `requireAdmin` and the `x-clearup-client: 1` mutation header; CSV uploads can change catalog data.

## Local admin setup

1. Set `ADMIN_EMAILS=your@email.com` in `backend/.env`.
2. Register/sign in with that email and verify it.
3. Visit `/admin/dashboard` — middleware should treat you as admin.

## Related files

| Area | Path |
|------|------|
| Admin server fetch | `frontend/src/lib/admin-server.ts` |
| Stats types | `frontend/src/types/routine-admin.ts` |
| Routine admin service methods | `backend/src/services/RoutineService.ts` |
| User admin route | `backend/src/routes/userRoutes.ts` |
