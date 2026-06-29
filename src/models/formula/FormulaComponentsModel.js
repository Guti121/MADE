import { pool } from "../../config/db.js";

export class FormulaComponentsModel {
  static async retrieveComponents({ brandId, data }) {
    const query = `
    SELECT
    c.id ,
  fc.formula_id,
  fc.quantity,
  fc.unit,

  f.name AS formula_name,
  f.final_quantity AS final_quantity,

  c.name AS component_name,

  s.avg_price,
  s.wholesale_price,
  s.consumer_price

FROM formula_components fc

JOIN formulas f
  ON fc.formula_id = f.id

JOIN components c
  ON fc.component_id = c.id

JOIN stock s
  ON s.component_id = c.id

WHERE f.brand_id = $1
  AND fc.formula_id = $2

  AND NOT EXISTS (
    SELECT 1

    FROM formula_components fc2

    JOIN components c2
      ON c2.id = fc2.component_id

    WHERE fc2.formula_id = f.id
      AND c2.state = FALSE
  )
  `;

    const values = [brandId, data.id];

    const result = await pool.query(query, values);

    return result.rows;
  }
}
