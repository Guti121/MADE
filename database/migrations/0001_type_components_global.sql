-- Migration: make type_components a global catalog shared by every brand/location.
-- Before: type_components(id, name, brand_id NOT NULL) -> one set of types per brand.
-- After:  type_components(id, name)                    -> one shared catalog, seed-managed.
--
-- Safe to run on an existing database. Wrapped in a single transaction.
-- Review the result of steps 2-4 before COMMIT when running against production data.

BEGIN;

-- 1. Drop the CASCADE FK so re-pointing components does not delete them.
ALTER TABLE components DROP CONSTRAINT fk_type_component;

-- 2. Harvest the names brands already use into global rows (dedupe case-insensitive).
INSERT INTO type_components (name)
SELECT DISTINCT ON (lower(trim(name))) trim(name)
FROM   type_components
WHERE  brand_id IS NOT NULL
ORDER  BY lower(trim(name)), id;

-- 3. Add the default perfumery catalog for any name not present yet.
INSERT INTO type_components (name)
SELECT v.name
FROM (VALUES
  ('Esencias'),
  ('Absolutos'),
  ('Aromas'),
  ('Fijadores'),
  ('Feromonas'),
  ('Alcohol'),
  ('Diluyentes'),
  ('Agua destilada'),
  ('Solubilizantes'),
  ('Conservantes'),
  ('Antioxidantes'),
  ('Colorantes'),
  ('Resinas y bálsamos')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM type_components t
  WHERE lower(t.name) = lower(v.name) AND t.brand_id IS NULL
);

-- 4. Re-point every component to the global row with the matching name.
WITH map AS (
  SELECT old.id AS old_id, g.id AS new_id
  FROM   type_components old
  JOIN   type_components g
    ON  lower(trim(g.name)) = lower(trim(old.name))
   AND  g.brand_id IS NULL
  WHERE old.brand_id IS NOT NULL
)
UPDATE components c
SET    type_component_id = map.new_id
FROM   map
WHERE  c.type_component_id = map.old_id;

-- Guard: fail loudly if any component still points at a per-brand row.
DO $$
DECLARE
  orphans integer;
BEGIN
  SELECT count(*) INTO orphans
  FROM   components c
  JOIN   type_components t ON t.id = c.type_component_id
  WHERE  t.brand_id IS NOT NULL;

  IF orphans > 0 THEN
    RAISE EXCEPTION 'Aborting: % component(s) still reference a per-brand type_component', orphans;
  END IF;
END $$;

-- 5. Remove the old per-brand rows.
DELETE FROM type_components WHERE brand_id IS NOT NULL;

-- 6. Drop brand_id and its FK.
ALTER TABLE type_components DROP CONSTRAINT fk_brand;
ALTER TABLE type_components DROP COLUMN brand_id;

-- 7. Uniqueness on name + a safe (non-cascading) FK from components.
ALTER TABLE type_components ADD CONSTRAINT uq_type_components_name UNIQUE (name);
ALTER TABLE components
  ADD CONSTRAINT fk_type_component FOREIGN KEY (type_component_id)
  REFERENCES type_components(id) ON UPDATE NO ACTION ON DELETE RESTRICT;

COMMIT;
