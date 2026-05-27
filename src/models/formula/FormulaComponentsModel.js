import { pool } from "../../config/db.js";

export class FormulaComponentsModel {
  static async retrieveComponents({ brandId, data }) {
    const query = `SELECT
        fc.id,
        fc.quantity,
        fc.unit,

        f.name AS formula_name,

        c.name AS component_name

        FROM formula_components fc

        JOIN formulas f
        ON fc.formula_id = f.id

        JOIN components c
        ON fc.component_id = c.id

        WHERE f.brand_id = $1
        AND fc.formula_id = $2`;
    console.log(brandId, data.id);
    const values = [brandId, data.id];

    const result = await pool.query(query, values);

    return result.rows;
  }
}
