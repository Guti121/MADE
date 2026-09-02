import { pool } from "../../config/db.js";

export class FormulaComponentsModel {
  static async retrieveComponents({ brandId, data }) {
    const query = `
    SELECT
      fc.id,
      fc.formula_id,
      fc.component_id,
      fc.type_component_id,
      fc.quantity,
      fc.unit,

      f.name AS formula_name,
      f.final_quantity AS final_quantity,
      f.wholesale_price AS formula_wholesale_price,
      f.consumer_price AS formula_consumer_price,

      c.name AS component_name,
      tc.name AS type_component_name,

      sp.avg_price,
      sp.wholesale_price,
      sp.consumer_price,
      sp.sedes_con_stock

    FROM formula_components fc

    JOIN formulas f
      ON fc.formula_id = f.id

    LEFT JOIN components c
      ON fc.component_id = c.id

    LEFT JOIN type_components tc
      ON fc.type_component_id = tc.id

    LEFT JOIN LATERAL (
      SELECT
        AVG(s.avg_price)       AS avg_price,
        AVG(s.wholesale_price) AS wholesale_price,
        AVG(s.consumer_price)  AS consumer_price,
        COUNT(*)               AS sedes_con_stock
      FROM stock s
      WHERE s.component_id = fc.component_id
        AND s.state = true
    ) sp ON true

    WHERE f.brand_id = $1
      AND f.state = TRUE
      AND fc.formula_id = $2

      AND NOT EXISTS (
        SELECT 1

        FROM formula_components fc2

        JOIN components c2
          ON c2.id = fc2.component_id

        WHERE fc2.formula_id = f.id
          AND fc2.component_id IS NOT NULL
          AND c2.state = FALSE
      )
  `;

    const values = [brandId, data.id];

    const result = await pool.query(query, values);

    return result.rows;
  }
}
