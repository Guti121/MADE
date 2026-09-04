-- Migration: Jar stock (tarro a la mano).
-- Second stock tier per component+location: `stock` stays the bulk "bodega"
-- quantity, `component_jar_stock` is the small quantity staff dispense from
-- directly when preparing a sale. Refilled from bodega via a manual transfer
-- (movement_type TRANSFER_OUT on the bodega side, TRANSFER_IN on the jar side).
--
-- Idempotent. Single transaction.

BEGIN;

CREATE TABLE IF NOT EXISTS component_jar_stock (
  id SERIAL PRIMARY KEY,
  component_id INTEGER NOT NULL REFERENCES components(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  quantity_base NUMERIC(12,2) NOT NULL DEFAULT 0,
  state BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER NOT NULL REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id) ON UPDATE NO ACTION ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_jar_component_location UNIQUE (component_id, location_id)
);

CREATE TABLE IF NOT EXISTS jar_movements (
  id SERIAL PRIMARY KEY,
  jar_stock_id INTEGER NOT NULL REFERENCES component_jar_stock(id) ON UPDATE NO ACTION ON DELETE CASCADE,
  location_id INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity NUMERIC(14,2) NOT NULL,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id) ON UPDATE NO ACTION ON DELETE RESTRICT
);

COMMIT;
