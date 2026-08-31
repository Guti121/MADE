# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

MADE backend: a Node.js/Express REST API for managing a brand's inventory — components (raw ingredients), containers (packaging), formulas (recipes combining components), stock/stock-container levels, and sales. Data model is multi-tenant: every resource hangs off a `brand`, which belongs to a `user`; brands have `locations`, and stock is tracked per location.

## Commands

- `npm run dev` — start the server with nodemon (auto-restart on change). Entry point is `app.js`, default port 1234 (`PORT` env var).
- No test suite is configured (`npm test` is a stub that exits with an error).
- No lint script is wired up, but `eslintConfig` extends `standard` and `standard` is a devDependency — run ad hoc with `npx standard` if linting is needed.
- Requires a running PostgreSQL instance. Connection is configured via env vars (`DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`) plus `SALT_ROUNDS`, `SECRET_KEY_TOKEN`, `REFRESH_TOKEN_SECRET`. No migration/seed scripts exist in the repo — schema is assumed to already exist in the target database.

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

### Auth flow

JWT-based, two tokens: a short-lived `access_token` (15m, signed with `SECRET_KEY_TOKEN`) and a longer-lived `refresh_token` (7d, signed with `REFRESH_TOKEN_SECRET`, persisted server-side and checked against the DB row on refresh so a token can be invalidated by deleting the session). Both are set as httpOnly, `sameSite: strict` cookies. Passwords are hashed with bcrypt (`SALT_ROUNDS`). `config/config.js` has a hardcoded fallback for `SECRET_KEY_TOKEN` used only when the env var is unset.

### CORS

`app.js` locks CORS to `http://localhost:5173` with `credentials: true` — this backend expects a Vite-based frontend consuming it from that origin.
