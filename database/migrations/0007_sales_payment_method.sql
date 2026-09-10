-- Migration: payment method per sale.
-- Lets the brand know how each sale was paid (cash, transfer, card, or a
-- BNPL provider) so reporting can break revenue down by channel later.
--
-- VARCHAR + CHECK (not an ENUM) so adding a provider in the future is a
-- single ALTER ... DROP/ADD CONSTRAINT, no type migration.
--
-- Vocabulary: EFECTIVO, TRANSFERENCIA, TARJETA, ADDI, SISTECREDITO.
-- Existing rows default to EFECTIVO. Re-runnable. Single transaction.

BEGIN;

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) NOT NULL DEFAULT 'EFECTIVO';

ALTER TABLE sales DROP CONSTRAINT IF EXISTS chk_sales_payment_method;
ALTER TABLE sales ADD CONSTRAINT chk_sales_payment_method
  CHECK (payment_method IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'ADDI', 'SISTECREDITO'));

COMMIT;
