-- Migration: force every NUMERIC column to 0 decimal places.
-- The brand works in whole currency units (no cents) and whole
-- quantity units; the frontend formats values for display. Storing
-- raw integers keeps writes unambiguous (user types 10000 -> 10000).
--
-- ALTER ... TYPE numeric(p,0) rounds existing rows automatically
-- (half-up), and Postgres rounds on every future INSERT/UPDATE too,
-- so no application-layer rounding change is required.
--
-- Re-running is safe: re-casting an already numeric(p,0) column is a
-- no-op. Single transaction.

BEGIN;

-- formulas
ALTER TABLE formulas ALTER COLUMN final_quantity TYPE NUMERIC(14,0) USING round(final_quantity);
-- consumer_price / wholesale_price already NUMERIC(12,0)

-- containers
ALTER TABLE containers ALTER COLUMN capacity TYPE NUMERIC(12,0) USING round(capacity);

-- sales
ALTER TABLE sales ALTER COLUMN subtotal       TYPE NUMERIC(14,0) USING round(subtotal);
ALTER TABLE sales ALTER COLUMN discount_total TYPE NUMERIC(14,0) USING round(discount_total);
ALTER TABLE sales ALTER COLUMN tax_total      TYPE NUMERIC(14,0) USING round(tax_total);
ALTER TABLE sales ALTER COLUMN total_cost     TYPE NUMERIC(14,0) USING round(total_cost);
ALTER TABLE sales ALTER COLUMN total_profit   TYPE NUMERIC(14,0) USING round(total_profit);

-- clients
ALTER TABLE clients ALTER COLUMN total_spend TYPE NUMERIC(14,0) USING round(total_spend);

-- containers_stock: quantity / avg_price / wholesale_price / consumer_price already NUMERIC(12,0)

-- formula_components
ALTER TABLE formula_components ALTER COLUMN quantity TYPE NUMERIC(12,0) USING round(quantity);

-- sales_items
ALTER TABLE sales_items ALTER COLUMN quantity   TYPE NUMERIC(14,0) USING round(quantity);
ALTER TABLE sales_items ALTER COLUMN subtotal   TYPE NUMERIC(14,0) USING round(subtotal);
ALTER TABLE sales_items ALTER COLUMN discount   TYPE NUMERIC(14,0) USING round(discount);
ALTER TABLE sales_items ALTER COLUMN tax        TYPE NUMERIC(14,0) USING round(tax);
ALTER TABLE sales_items ALTER COLUMN total_cost TYPE NUMERIC(14,0) USING round(total_cost);
-- formula_unit_price / formula_base_price already NUMERIC(12,0)

-- stock
ALTER TABLE stock ALTER COLUMN quantity_base   TYPE NUMERIC(12,0) USING round(quantity_base);
ALTER TABLE stock ALTER COLUMN avg_price       TYPE NUMERIC(12,0) USING round(avg_price);
ALTER TABLE stock ALTER COLUMN wholesale_price TYPE NUMERIC(12,0) USING round(wholesale_price);
ALTER TABLE stock ALTER COLUMN consumer_price  TYPE NUMERIC(12,0) USING round(consumer_price);

-- component_jar_stock
ALTER TABLE component_jar_stock ALTER COLUMN quantity_base TYPE NUMERIC(12,0) USING round(quantity_base);

-- jar_movements
ALTER TABLE jar_movements ALTER COLUMN quantity    TYPE NUMERIC(14,0) USING round(quantity);
ALTER TABLE jar_movements ALTER COLUMN unit_price  TYPE NUMERIC(14,0) USING round(unit_price);
ALTER TABLE jar_movements ALTER COLUMN total_price TYPE NUMERIC(14,0) USING round(total_price);

-- container_movements
ALTER TABLE container_movements ALTER COLUMN quantity    TYPE NUMERIC(14,0) USING round(quantity);
ALTER TABLE container_movements ALTER COLUMN unit_price  TYPE NUMERIC(14,0) USING round(unit_price);
ALTER TABLE container_movements ALTER COLUMN total_price TYPE NUMERIC(14,0) USING round(total_price);

-- sale_item_components
ALTER TABLE sale_item_components ALTER COLUMN quantity_used TYPE NUMERIC(14,0) USING round(quantity_used);
ALTER TABLE sale_item_components ALTER COLUMN unit_cost     TYPE NUMERIC(14,0) USING round(unit_cost);
ALTER TABLE sale_item_components ALTER COLUMN total_cost    TYPE NUMERIC(14,0) USING round(total_cost);
-- unit_price / total_price already NUMERIC(14,0)

-- sale_item_containers
ALTER TABLE sale_item_containers ALTER COLUMN quantity_used TYPE NUMERIC(14,0) USING round(quantity_used);
ALTER TABLE sale_item_containers ALTER COLUMN unit_cost     TYPE NUMERIC(14,0) USING round(unit_cost);
ALTER TABLE sale_item_containers ALTER COLUMN total_cost    TYPE NUMERIC(14,0) USING round(total_cost);
-- unit_price / total_price already NUMERIC(14,0)

-- stock_movements
ALTER TABLE stock_movements ALTER COLUMN quantity    TYPE NUMERIC(14,0) USING round(quantity);
ALTER TABLE stock_movements ALTER COLUMN unit_price  TYPE NUMERIC(14,0) USING round(unit_price);
ALTER TABLE stock_movements ALTER COLUMN total_price TYPE NUMERIC(14,0) USING round(total_price);

COMMIT;
