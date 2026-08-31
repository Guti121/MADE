// Seeds test components + stock (with INITIAL_STOCK movements) for local testing.
//
//   node database/seed-test-data.js
//
// Targets the first brand, its owner user, and that brand's first location.
// Safe to re-run: existing components/stock rows are skipped, not duplicated.
import { pool } from "../src/config/db.js";

const COMPONENTS = [
  { name: "Esencia de Lavanda", type: "Esencias", qty: 2500, avg: 180, wholesale: 260, consumer: 400 },
  { name: "Esencia de Bergamota", type: "Esencias", qty: 1800, avg: 220, wholesale: 320, consumer: 480 },
  { name: "Absoluto de Jazmín", type: "Absolutos", qty: 300, avg: 3200, wholesale: 4200, consumer: 6500 },
  { name: "Absoluto de Rosa", type: "Absolutos", qty: 250, avg: 3800, wholesale: 4900, consumer: 7200 },
  { name: "Ambroxan", type: "Fijadores", qty: 1200, avg: 900, wholesale: 1250, consumer: 1900 },
  { name: "Almizcle Blanco", type: "Fijadores", qty: 1500, avg: 650, wholesale: 900, consumer: 1400 },
  { name: "Alcohol Perfumístico 96°", type: "Alcohol", qty: 20000, avg: 18, wholesale: 28, consumer: 45 },
  { name: "Dipropilenglicol (DPG)", type: "Diluyentes", qty: 15000, avg: 12, wholesale: 20, consumer: 32 },
  { name: "Agua Destilada", type: "Agua destilada", qty: 30000, avg: 3, wholesale: 6, consumer: 10 },
  { name: "Feromona Osmoferina", type: "Feromonas", qty: 400, avg: 1500, wholesale: 2100, consumer: 3200 },
  { name: "Polisorbato 20", type: "Solubilizantes", qty: 5000, avg: 40, wholesale: 65, consumer: 100 },
  { name: "Tocoferol (Vitamina E)", type: "Antioxidantes", qty: 800, avg: 300, wholesale: 430, consumer: 650 },
];

const client = await pool.connect();

try {
  await client.query("BEGIN");

  const { rows: brandRows } = await client.query(
    "SELECT id, user_id FROM brands ORDER BY id LIMIT 1",
  );
  if (brandRows.length === 0) throw new Error("No brands in database");
  const brandId = brandRows[0].id;
  const userId = brandRows[0].user_id;

  const { rows: locRows } = await client.query(
    "SELECT id FROM locations WHERE brand_id = $1 ORDER BY id LIMIT 1",
    [brandId],
  );
  if (locRows.length === 0) throw new Error(`Brand ${brandId} has no locations`);
  const locationId = locRows[0].id;

  const { rows: typeRows } = await client.query("SELECT id, name FROM type_components");
  const typeByName = new Map(typeRows.map((t) => [t.name, t.id]));

  let componentsCreated = 0;
  let stockCreated = 0;

  for (const c of COMPONENTS) {
    const typeId = typeByName.get(c.type);
    if (!typeId) throw new Error(`Missing type_component "${c.type}" — run the migration first`);

    // component (skip if a same-named one already exists for this brand)
    let { rows: compRows } = await client.query(
      `INSERT INTO components (name, type_component_id, brand_id, state)
       SELECT $1::varchar, $2::integer, $3::integer, true
       WHERE NOT EXISTS (
         SELECT 1 FROM components WHERE name = $1 AND brand_id = $3
       )
       RETURNING id`,
      [c.name, typeId, brandId],
    );

    let componentId;
    if (compRows.length > 0) {
      componentId = compRows[0].id;
      componentsCreated++;
    } else {
      const existing = await client.query(
        "SELECT id FROM components WHERE name = $1 AND brand_id = $2",
        [c.name, brandId],
      );
      componentId = existing.rows[0].id;
    }

    // stock row for the location
    const stockRes = await client.query(
      `INSERT INTO stock
         (component_id, location_id, quantity_base, avg_price, wholesale_price, consumer_price, created_by, updated_by, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, true)
       ON CONFLICT (component_id, location_id) DO NOTHING
       RETURNING id`,
      [componentId, locationId, c.qty, c.avg, c.wholesale, c.consumer, userId],
    );

    if (stockRes.rows.length > 0) {
      const stockId = stockRes.rows[0].id;
      stockCreated++;

      // immutable movement record (audit-trail pattern)
      await client.query(
        `INSERT INTO stock_movements
           (stock_id, movement_type, quantity, unit_price, total_price, reference_type, notes, created_by, location_id)
         VALUES ($1, 'INITIAL_STOCK', $2, $3, $4, 'SEED', 'Seed data (database/seed-test-data.js)', $5, $6)`,
        [stockId, c.qty, c.avg, Number((c.qty * c.avg).toFixed(2)), userId, locationId],
      );
    }
  }

  await client.query("COMMIT");
  console.log(
    `OK — brand ${brandId}, location ${locationId}, user ${userId}\n` +
      `  components created: ${componentsCreated} (of ${COMPONENTS.length})\n` +
      `  stock rows created: ${stockCreated}`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
