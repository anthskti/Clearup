# User Module (Backend)

The **user** module covers identity, sessions, and role handling. **Better Auth** drives sign-in, sign-up, OAuth, and session storage against the same **PostgreSQL** database the app uses (`DATABASE_URL`). Application code extends that with a **Sequelize `User` model** (including `role` for admin) and a small **UserRepository** for admin analytics.

Better Auth owns account mutations. The application has a read-only `UserController → UserService → UserRepository` path for the admin directory, plus the “who am I” endpoint wired in `index.ts`.

## Data Models

Better Auth and Sequelize share one database. Core tables exposed as Sequelize models:

- User (`User.ts`): Core basis for ClearUp users. Stores standard informations with verification.
- Accounts (`Account.ts`): Handles the identity provider details for Better Auth.
- Sessions (`Session.ts`): Manages active user sessions, tracks IP address and session keys; this allows users to stay logged in.
- Verification.ts (`Verification.ts`): Supports email verification system, storing secure and temporary tokens required to validate a newly registered email address.

## Repository

The repository layer performs direct database reads for operational/analytics use cases.

- UserRepository (`UserRepository.ts`): Read-only admin search/filter/pagination with routine counts, plus analytics helpers. ID/name/email search treats SQL LIKE metacharacters literally and results sort by creation date and ID.
  Better Auth continues to own writes for authentication tables during normal sign-in and OAuth flows.

## Type Definitions

Strict shapes for repository outputs live in `types/user.ts`:

## Better Auth Configuration (`config/auth.ts`)

Central Better Auth setup:

- `database`: `pg` **Pool** using `DATABASE_URL` (TLS options tuned for hosted Postgres). This is not tied to a specific vendor name in code, it is whatever Postgres URL you configure.
- `emailAndPassword`: Enabled; `requireEmailVerification` is on when verification email delivery is reliable.
- **emailVerification++ / **sendResetPassword\*\*\*\*: Send mail via `sendSesEmail` (Amazon SES). Messages are functional plain text + simple HTML; styling/branding can be improved later.
- **`socialProviders.google`**: Google OAuth using **`GOOGLE_CLIENT_ID`** and **`GOOGLE_CLIENT_SECRET`**.
- **`trustedOrigins`**: Parsed from **`TRUSTED_ORIGINS`** (comma-separated), aligned with CORS in `index.ts`.
- **`plugin: [admin()]`**: Better Auth admin plugin (works alongside app-level admin checks).

## Middleware

### `middleware/requireAuth.ts`

- `requireAuth`: Loads the Better Auth session, attaches req.user (id, optional email, optional role), then applies **admin resolution**:
  - If the session user is already `admin`, keeps it.
  - Otherwise hydrates **email / role from the DB** when the session omits them.
  - `ADMIN_EMAILS` (comma-separated env list): matching verified emails are treated as admins; the middleware attempts to User.update`({ role: "admin" })` so the role persists (authorization does not wait on write success).
- `requireAdmin`: Same session + whitelist logic, then responds **403** unless **role === "admin"**.

### `middleware/security.ts` (auth route helpers)

Selected auth routes are recorded by `authAuditLogger` with sanitized path and request metadata before the app's rate policy guard. The app classifies email/password login, recovery flows, session reads, and other enabled auth actions into separate token buckets. Better Auth also applies its production rate limits. See [rate limiting](../../../docs/backend-architecture.md#5-rate-limiting-summary) for policies and limitations.

### `lib/security.ts`

Support utilities shared with the rest of the app:

- `redactSensitiveFields`: strips/redacts known sensitive keys (passwords, tokens, cookies, etc.) before structured logs.
- `logSecurityEvent`: structured `security.audit` records with redaction.
- `validateSecurityConfig`: startup checks (e.g. warning if `TRUSTED_ORIGINS` is too permissive in production).

## HTTP Surface (see also `index.md`)

User-facing auth HTTP is not a dedicated `userRoutes` file:

- `ALL /api/auth/*path` — delegated to Better Auth via `toNodeHandler(auth)` (sign-in, sign-up, sign-out, OAuth callbacks, etc.).
- `GET /api/auth/me` — returns **{ id, email, role }** for the current session (uses `requireAuth`).
- `GET /api/users/admin` — admin-only directory with `search`, `role`, `verified`, `limit`, and `offset`; includes creation timestamps and routine counts. See [admin operations](../../../docs/features/admin-operations.md#user-directory).
