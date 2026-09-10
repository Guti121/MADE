-- Migration: non-negativity CHECK constraints + missing foreign keys.
--
-- Stock balances and every price/cost/total must never go negative. Movement
-- rows keep a SIGNED `quantity` (a LOSS / ADJUSTMENT - stores a negative delta),
-- so those are guarded on price columns only, not on quantity.
--
-- Constraints are added NOT VALID (enforced for new/updated rows immediately)
-- and VALIDATED in separate statements, so a single legacy bad row does not
-- roll back the whole deploy. If a VALIDATE fails, run the matching diagnostic
-- SELECT below, fix the rows, and re-run just that VALIDATE.
--
-- Also adds the FKs container_movements was missing. They are ON DELETE
-- RESTRICT: the movement ledger is append-only (see CLAUDE.md), so deleting a
-- referenced container/location must be blocked, not silently cascade.
--
-- Re-runnable.

-- ---------------------------------------------------------------------------
-- Diagnostics — run these first if a VALIDATE below fails:
--   SELECT id FROM stock WHERE quantity_base < 0 OR avg_price < 0 OR wholesale_price < 0 OR consumer_price < 0;
--   SELECT id FROM containers_stock WHERE quantity < 0 OR avg_price < 0 OR wholesale_price < 0 OR consumer_price < 0;
--   SELECT id FROM component_jar_stock WHERE quantity_base < 0;
--   SELECT id FROM formula_components WHERE quantity <= 0;
--   SELECT id FROM sales_items WHERE quantity <= 0 OR subtotal < 0 OR total_cost < 0;
--   SELECT id FROM stock_movements WHERE unit_price < 0 OR total_price < 0;
--   SELECT id FROM container_movements WHERE unit_price < 0 OR total_price < 0;
--   SELECT id FROM jar_movements WHERE unit_price < 0 OR total_price < 0;
--   SELECT cm.id FROM container_movements cm LEFT JOIN containers c ON c.id = cm.container_id WHERE c.id IS NULL;
--   SELECT cm.id FROM container_movements cm LEFT JOIN locations l ON l.id = cm.location_id WHERE l.id IS NULL;
-- ---------------------------------------------------------------------------

BEGIN;

-- ---- balance / level tables --------------------------------------------------
ALTER TABLE stock DROP CONSTRAINT IF EXISTS chk_stock_nonneg;
ALTER TABLE stock ADD CONSTRAINT chk_stock_nonneg CHECK (
  quantity_base >= 0 AND avg_price >= 0 AND wholesale_price >= 0 AND consumer_price >= 0
) NOT VALID;

ALTER TABLE containers_stock DROP CONSTRAINT IF EXISTS chk_containers_stock_nonneg;
ALTER TABLE containers_stock ADD CONSTRAINT chk_containers_stock_nonneg CHECK (
  quantity >= 0 AND avg_price >= 0 AND wholesale_price >= 0 AND consumer_price >= 0
) NOT VALID;

ALTER TABLE component_jar_stock DROP CONSTRAINT IF EXISTS chk_component_jar_stock_nonneg;
ALTER TABLE component_jar_stock ADD CONSTRAINT chk_component_jar_stock_nonneg CHECK (
  quantity_base >= 0
) NOT VALID;

-- ---- recipe / sale line quantities ----------------------------------------
ALTER TABLE formula_components DROP CONSTRAINT IF EXISTS chk_formula_components_qty_pos;
ALTER TABLE formula_components ADD CONSTRAINT chk_formula_components_qty_pos CHECK (
  quantity > 0
) NOT VALID;

ALTER TABLE sales_items DROP CONSTRAINT IF EXISTS chk_sales_items_nonneg;
ALTER TABLE sales_items ADD CONSTRAINT chk_sales_items_nonneg CHECK (
  quantity > 0 AND subtotal >= 0 AND total_cost >= 0
) NOT VALID;

-- ---- movement price columns (quantity stays signed) ----------------------
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS chk_stock_movements_price_nonneg;
ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movements_price_nonneg CHECK (
  unit_price >= 0 AND total_price >= 0
) NOT VALID;

ALTER TABLE container_movements DROP CONSTRAINT IF EXISTS chk_container_movements_price_nonneg;
ALTER TABLE container_movements ADD CONSTRAINT chk_container_movements_price_nonneg CHECK (
  unit_price >= 0 AND total_price >= 0
) NOT VALID;

ALTER TABLE jar_movements DROP CONSTRAINT IF EXISTS chk_jar_movements_price_nonneg;
ALTER TABLE jar_movements ADD CONSTRAINT chk_jar_movements_price_nonneg CHECK (
  unit_price >= 0 AND total_price >= 0
) NOT VALID;

-- ---- container_movements: missing foreign keys (append-only → RESTRICT) --
ALTER TABLE container_movements DROP CONSTRAINT IF EXISTS fk_container_movement_container;
ALTER TABLE container_movements ADD CONSTRAINT fk_container_movement_container
  FOREIGN KEY (container_id) REFERENCES containers(id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT VALID;

ALTER TABLE container_movements DROP CONSTRAINT IF EXISTS fk_container_movement_location;
ALTER TABLE container_movements ADD CONSTRAINT fk_container_movement_location
  FOREIGN KEY (location_id) REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE RESTRICT NOT VALID;

ALTER TABLE container_movements DROP CONSTRAINT IF EXISTS fk_container_movement_created_by;
ALTER TABLE container_movements ADD CONSTRAINT fk_container_movement_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL NOT VALID;

COMMIT;

-- ---- validate legacy rows (each independent; safe to re-run) -------------
ALTER TABLE stock                VALIDATE CONSTRAINT chk_stock_nonneg;
ALTER TABLE containers_stock     VALIDATE CONSTRAINT chk_containers_stock_nonneg;
ALTER TABLE component_jar_stock  VALIDATE CONSTRAINT chk_component_jar_stock_nonneg;
ALTER TABLE formula_components   VALIDATE CONSTRAINT chk_formula_components_qty_pos;
ALTER TABLE sales_items          VALIDATE CONSTRAINT chk_sales_items_nonneg;
ALTER TABLE stock_movements      VALIDATE CONSTRAINT chk_stock_movements_price_nonneg;
ALTER TABLE container_movements  VALIDATE CONSTRAINT chk_container_movements_price_nonneg;
ALTER TABLE jar_movements        VALIDATE CONSTRAINT chk_jar_movements_price_nonneg;
ALTER TABLE container_movements  VALIDATE CONSTRAINT fk_container_movement_container;
ALTER TABLE container_movements  VALIDATE CONSTRAINT fk_container_movement_location;
ALTER TABLE container_movements  VALIDATE CONSTRAINT fk_container_movement_created_by;
