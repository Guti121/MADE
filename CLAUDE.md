# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MADE backend: a Node.js/Express REST API for managing a brand's inventory — components (raw ingredients), containers (packaging), formulas (recipes combining components), stock/stock-container levels, and sales. Data model is multi-tenant: every resource hangs off a `brand`, which belongs to a `user`; brands have `locations`, and stock is tracked per location.

## Commands

- `npm run dev` — start the server with nodemon (auto-restart on change). Entry point is `app.js`, default port 1234 (`PORT` env var).
- No test suite is configured (`npm test` is a stub that exits with an error).
- No lint script is wired up, but `eslintConfig` extends `standard` and `standard` is a devDependency — run ad hoc with `npx standard` if linting is needed.
- Requires a running PostgreSQL instance. Connection is configured via env vars (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`) plus `SALT_ROUNDS`, `SECRET_KEY_TOKEN`, `REFRESH_TOKEN_SECRET`, and optionally `NODE_ENV`, `CORS_ORIGIN`, `COOKIE_SECRET`, `LOG_LEVEL`, `PORT`, `TRUST_PROXY` (see `.env.example`). The server refuses to start if `SECRET_KEY_TOKEN` or `REFRESH_TOKEN_SECRET` is unset (or equal to each other) — there is no fallback.
- `npm run db:setup` — **first deploy against a brand-new, empty database**: one command that creates every table/type/constraint (`database/schema.sql`) plus the least-privilege `made_app` role (`database/migrations/0009_app_role.sql`), then prints the two manual steps left (set `made_app`'s password, point `DB_USER`/`DB_PASSWORD` at it). Run this once, as a superuser/admin connection — not as `made_app`.
- `database/schema.sql` is the full baseline, kept up to date through migration `0011` — a fresh database needs only this file (via `db:setup`), not the individual migrations. `database/migrations/NNNN_*.sql` are applied one-by-one via `npm run db:migrate -- <file>` (`database/run-migration.js`, a raw-SQL runner with no version table) — kept for historical reference and for any database that was already migrated step-by-step before `db:setup` existed. Any new schema change is a fresh migration starting at `0012`; fold it into `schema.sql` once it's been applied everywhere that matters.

## Architecture

Strict layered pattern, repeated per feature (`user`, `brand`, `location`, `components`, `containers`, `formula`, `stock`, `sales`). Each layer is ESM (`"type": "module"` in package.json — always use `import`/`export`).

```
routes/  →  middleware  →  controllers/  →  services/  →  models/  →  Postgres
                                  ↓
                              shemas/ (Zod validation — note the intentional misspelling, used consistently everywhere; match it rather than "fixing" it)
```

- **routes/**: Express routers wire an HTTP verb+path to a controller static method, chaining middleware first (`authMiddleware`, then whichever `validate*Access` checks apply). Grouped by feature, some in subfolders (`routes/containers/`, `routes/stock/`, etc.) mirrored by matching subfolders in every other layer.
- **middleware/authMiddleware.js**: verifies the `access_token` JWT from an httpOnly cookie, attaches decoded payload to `req.user`.
- **middleware/accessMiddleware.js**: authorization checks that a referenced resource (brand/location/component/container) actually belongs to the authenticated user, via `AccessService`. Attaches the resolved resource to `req.brand` / `req.location`. Always run after `authMiddleware` in a route chain.
- **controllers/**: validate input with a Zod schema (`validateSchema` helper in `helpers/validateSchema.js`, or `schema.safeParse` directly), call into services/models, and shape the HTTP response. Controllers are `export class X { static async method(req, res) {} }` — no instantiation.
- **services/**: business logic and multi-step DB transactions. Two kinds of service files per feature:
  - "Logic"/"bussines logic" services (e.g. `LogicStockContainers.js`, `bussinesLogicStock.js`, `bussinesLogicFormula.js`, `logicBussinesSale.js`) — pure calculation (unit conversion, weighted-average price, loss/adjustment math). No DB access.
  - "Service" files (e.g. `stockContainerServices.js`, `saleService.js`, `formulaService.js`) — orchestrate multi-model writes inside a single Postgres client transaction (`pool.connect()` → `BEGIN` → ... → `COMMIT`/`ROLLBACK` → `client.release()`). Follow this transaction pattern for any new multi-table write.
- **models/**: raw parameterized SQL via `pg` (no ORM). Each static method takes either the shared `pool` or a transaction `client` as needed (methods used inside a service transaction accept `client` as their first arg). List endpoints follow a consistent paginated pattern: build a filtered `SELECT ... LIMIT/OFFSET` plus a matching `COUNT(*)` query, return `{ data, total, page, limit, totalPages }`.
- **shemas/**: Zod schemas, one export per operation (e.g. `createStockContainerSchema`, `updateStockContainerSchema`), used by controllers via `validateSchema()`.

### Stock movement ledger

Every stock/stock-container mutation writes two things inside one transaction: the updated quantity row, and an immutable movement record (`stockMovementModel` / `stockContainerMovement`) with a `movement_type` from a fixed vocabulary: `INITIAL_STOCK`, `PURCHASE`, `SALE`, `ADJUSTMENT` (or `ADJUSTMENT +`/`ADJUSTMENT -`), `LOSS`, `RETURN`. When adding new stock-affecting operations, preserve this audit-trail pattern rather than mutating quantity alone.

### Jar stock (bodega vs. tarro)

Each component also has a second, smaller stock tier per location: `component_jar_stock` (the "jar"/"tarro a la mano"), tracked separately from the bulk `stock` ("bodega") row. A sale decrements the jar (`ComponentJarStockModel.discountStock` + `JarMovementModel`, `movement_type: "SALE"`), never bodega directly — bodega only moves via purchases or a manual transfer into the jar (`JarStockService.transferToJar`, `POST /api/jar-stock/transfer`), which writes `TRANSFER_OUT` on the bodega side (`stock_movements`) and `TRANSFER_IN` on the jar side (`jar_movements`). Pricing (avg/wholesale/consumer price) still comes from bodega's `stock` row; the jar only tracks physical quantity. This split does not apply to containers — those stay bodega-only.

### Auth flow

JWT-based, two tokens: a short-lived `access_token` (15m, signed with `SECRET_KEY_TOKEN`) and a longer-lived `refresh_token` (7d, signed with `REFRESH_TOKEN_SECRET`). Only a SHA-256 hash of the refresh token is persisted in `user_sessions` (with `expires_at`); on refresh it is looked up by hash joined to `users.state = true`, then rotated. A valid-signature token with no matching active session row is treated as reuse and revokes every session for that user. Both cookies are httpOnly, `sameSite: strict`, and `secure` when `NODE_ENV === "production"`. Passwords are hashed with bcrypt (`SALT_ROUNDS`, min 12). `config/config.js` has NO secret fallback — a missing secret is a hard startup failure.

### CORS

`app.js` locks CORS to `http://localhost:5173` with `credentials: true` — this backend expects a Vite-based frontend consuming it from that origin.
