# ClearUp — Agent Context

Skincare organizer: browse a product catalog, compare merchant prices, build and share routines.
Two independent bun packages in one repo (no workspace tooling): run all commands from inside the package directory.

| Path        | What                                   | Stack                                                                      |
| ----------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `backend/`  | REST API, port 5050 by default         | Express 5, TypeScript, Sequelize 6, PostgreSQL, Better Auth, AWS SES       |
| `frontend/` | Web app                                | Next.js 16 App Router, React 19, Tailwind 4, shadcn/ui, Better Auth client |
| `docs/`     | Architecture, migrations, feature docs | Markdown                                                                   |
| `data/`     | CSV product/merchant data              | Do not edit by hand                                                        |

## Code readability

- Keep changes focused and code easy for the owner to understand, maintain, and tweak.
- Prefer straightforward control flow and descriptive names over unnecessary abstractions.
- Add short comments explaining non-obvious decisions. Flag confusing related code without refactoring unrelated areas.

## Commands

Backend (`cd backend`): `bun install`, `bun dev`, `bun run build` (tsc, the type check), `bun run migrate:up` / `migrate:down`, `bun run seed:merchants`.
Frontend (`cd frontend`): `bun install`, `bun dev`, `bun run lint`, `bun run build`.
There is no automated test suite. Validate with `bun run build` (both packages) and `bun run lint` (frontend), plus manual checks where relevant.

## Architecture rules

- Backend layering: `routes → controllers → services → repositories → models`. Controllers validate input and map responses, services hold business logic, and only repositories touch Sequelize queries.
- Better Auth owns the `user`, `account`, `session`, and `verification` tables; don't redefine them in app migrations without checking `backend/src/config/auth.ts`.
- Schema changes go through a numbered Umzug migration in `backend/src/migrations/` (idempotent, with `up` and `down`) and are registered in `migrations/index.ts`. See `docs/migrations.md`.
- Auth is Better Auth with cookie sessions; the frontend never holds a JWT. Guards: `requireAuth`, `requireAdmin`, `requireMutationHeader`.
- Frontend mutations must use `cache: "no-store"` and `mutationHeaders()` (`x-clearup-client: 1`). Reads use tiered `revalidate` in `frontend/src/lib/`.
- Frontend: Server Components by default; add `"use client"` only for interactivity. Use the `@/*` alias and existing `components/ui/` primitives.
- A change to an API route, payload, or auth behavior usually needs both `backend/` and `frontend/` (`frontend/src/lib/*`, `frontend/src/types/`) updated together.

## Reference docs (read when relevant, don't duplicate here)

- `README.md`: repo layout, boot sequence, auth, routes
- `docs/backend-architecture.md`: §1 ER diagram (read for any schema, migration, or model work), §2 request lifecycle (auth, middleware, or routing bugs), §3 component map, §5 rate limits. Large; read only the section you need.
- `docs/migrations.md`: migration workflow
- `docs/features/*.md`: auth, catalog/merchants, routine builder, admin
- `backend/docs/modules/*.md`: per-module backend notes

## Boundaries

- Never read, print, or edit `.env` files or `backend/certs/`. Use `.env.example` for variable names.
- Never edit generated or vendored output: `backend/dist/`, `frontend/.next/`, `node_modules/`, lockfiles (except via `bun add/remove`).
- Don't run destructive DB operations (`FORCE_SYNC=true`, `migrate:down`, seeds) against anything but a local database without explicit approval.
- Never delete existing table rows as part of schema changes, imports, cleanup, or maintenance. Prefer retaining rows and accepting larger tables; any genuinely necessary row deletion requires explicit user approval.
- Keep changes surgical; don't refactor unrelated code.

## Skills

Workflows live in `.agents/skills/`: `plan`, `implement`, `debug`, `review`. They assume this file has been read.
