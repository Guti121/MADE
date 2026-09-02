-- Migration: formula lines can be either a concrete component OR a type slot.
-- Enables the mandatory "Esencia" line on every formula (a type_components row,
-- with no component_id until it is picked at billing time).
--
-- Idempotent. Wrapped in a single transaction.

BEGIN;

-- A formula line no longer requires a concrete component.
ALTER TABLE formula_components ALTER COLUMN component_id DROP NOT NULL;

-- New: line can point at a type instead of a component.
ALTER TABLE formula_components
  ADD COLUMN IF NOT EXISTS type_component_id INTEGER
  REFERENCES type_components(id) ON UPDATE NO ACTION ON DELETE RESTRICT;

-- Every line must reference at least one of the two.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_formula_line'
  ) THEN
    ALTER TABLE formula_components
      ADD CONSTRAINT chk_formula_line
      CHECK (component_id IS NOT NULL OR type_component_id IS NOT NULL);
  END IF;
END $$;

-- Stable marker for the essence type (so we do not depend on the name string).
ALTER TABLE type_components ADD COLUMN IF NOT EXISTS code VARCHAR(30) UNIQUE;
UPDATE type_components SET code = 'ESSENCE' WHERE lower(name) = 'esencias';

COMMIT;
