-- Migration: add per-formula selling prices to the formulas table.
-- Matches the NUMERIC(12,0) money style already used by containers_stock.
-- Idempotent: safe to run on a database that already has these columns.

BEGIN;

ALTER TABLE formulas ADD COLUMN IF NOT EXISTS consumer_price  NUMERIC(12,0);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC(12,0);

COMMIT;
