-- Migration: session timestamps to timestamptz + sale discount/tax bounds.
--
-- 1. user_sessions.expires_at / created_at were `timestamp without time zone`.
--    node-postgres serializes a JS Date in the Node process TZ; Postgres then
--    stored a bare wall-clock and re-interpreted it in the DB session TZ on
--    every `expires_at > now()` comparison. If the two zones differ, sessions
--    expire early (→ spurious logouts) or linger. Move to timestamptz so the
--    instant is unambiguous. Run the app/container with TZ=UTC as well.
--
-- 2. sales_items.discount / .tax had no non-negativity guard (H2). Add one.
--    The upper bound (discount <= subtotal) is enforced in the service layer,
--    not here, since it is cross-column and business-tunable.
--
-- Re-runnable. Single transaction.

BEGIN;

ALTER TABLE user_sessions
  ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC';
ALTER TABLE user_sessions
  ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

ALTER TABLE sales_items DROP CONSTRAINT IF EXISTS chk_sales_items_discount_tax_nonneg;
ALTER TABLE sales_items ADD CONSTRAINT chk_sales_items_discount_tax_nonneg CHECK (
  discount >= 0 AND tax >= 0
);

COMMIT;
