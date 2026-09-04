-- Migration: Phase 3 billing.
-- Formula-priced sale items + per-unit essence charge + per-unit excess charge
-- for components whose quantity was increased at billing time, plus the missing
-- audit columns/movements.
--
-- Idempotent. Single transaction.

BEGIN;

-- Snapshot of the formula selling price applied to the item.
ALTER TABLE sales_items
  ADD COLUMN IF NOT EXISTS formula_unit_price NUMERIC(12,0),   -- per finished unit
  ADD COLUMN IF NOT EXISTS formula_base_price NUMERIC(12,0);    -- formula_unit_price * quantity

-- Which sale_item_component line is the chosen essence, plus a name snapshot
-- (the code already passes component_name_snapshot; the column was missing).
ALTER TABLE sale_item_components
  ADD COLUMN IF NOT EXISTS is_essence BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS component_name_snapshot VARCHAR(255);

-- Name snapshot for containers (also already passed by the code).
ALTER TABLE sale_item_containers
  ADD COLUMN IF NOT EXISTS container_name_snapshot VARCHAR(100);

COMMIT;
