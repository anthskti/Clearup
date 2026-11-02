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
| `/admin/dashboard` | Trends: new users vs guides created (`AdminTrendChart`) |
| `/admin/content` | Toggle **featured** routines for the landing page |
| `/admin/imports` | Product initialization, merchant offer import, and price refresh CSV controls |
| `/admin/users` | User listing / management surface |

## Admin API (summary)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/routines/admin/stats?days=14` | Dashboard time series |
| `GET /api/routines/admin/featured` | List featured routine IDs |
| `POST /api/routines/admin/featured/:id` | Feature a guide |
| `DELETE /api/routines/admin/featured/:id` | Unfeature |
| `GET /api/users/admin` | User admin listing |
| Product POST/PUT/DELETE, `/api/products/admin/import/csv`, `/offers`, `/prices` | Catalog management and imports |
| `/api/merchant` POST/PUT/DELETE | Merchant master data |

All of the above require an admin session cookie on fetch (`credentials: "include"` in `frontend/src/lib/admin-server.ts` and routine admin helpers).

## Featured content workflow

1. Community publishes routines (saved guides).
2. Admin opens **Content** and selects routines to feature (respecting `FEATURED_CAP`).
3. Home page `FeaturedRoutinesSection` loads `GET /api/routines/featured`.

Featured rows are stored in `featured_routines`, not a flag on `routines` alone—allows ordering and metadata without overloading the routine table.

## Imports & catalog maintenance

The imports page is built for operational reality: scrapers hit heterogeneous retailer HTML, so imports can partially fail.

Typical flow:

1. Initialize catalog products with the product CSV, or create them in the client.
2. Import matched rows from a reviewed merchant master to add links and offers to existing products.
3. Refresh prices and stock from `brand,name,price,merchant,stock` CSVs. Refreshes require an existing offer and preserve its link.
4. Review skipped and failed row counts in `ImportsAdminClient`; correct rows and re-run as needed.

`bun run seed` in development uses `sequelize.sync({ force: true })` and is **destructive**—never run against production.

## Dashboard stats

`GET /api/routines/admin/stats` returns aggregates used by the dashboard (users registered vs routines/guides created per day). Types live in `routine-admin.ts` on both frontend and backend.

## Security considerations

- Keep `ADMIN_EMAILS` minimal; prefer persisting `role: "admin"` in the database for long-term operators.
- Admin routes inherit global rate limits but are not anonymous—session required.
- Do not expose import endpoints without `requireAdmin`; CSV upload can mutate large parts of the catalog.

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
