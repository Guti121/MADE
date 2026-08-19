import { pool } from "../../config/db.js";

export class FormulaModel {
  static async createFormula(client, { userId, brandId, data, convertUnit }) {
    const query = `INSERT INTO formulas (name, brand_id, final_quantity,unit,container_id,created_by) 
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;

    const values = [
      data.name,
      brandId,
      convertUnit.sumTotalUnits,
      convertUnit.listComponents[0].unit,
      data.container || null,
      userId,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }

  static async createFormulaComponent(client, { formulaId, convertUnit }) {
    const query = `
    INSERT INTO formula_components (
      formula_id,
      component_id,
      quantity,
      unit
    ) 
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
    let results = [];

    for (const component of convertUnit.listComponents) {
      const values = [
        formulaId,
        component.component_id,
        component.quantityInBase,
        component.unit,
      ];

      const result = await client.query(query, values);

      results.push(result.rows[0]);
    }

    return results;
  }
  static async deleteFormula({ brandId, data }) {
    const query = `
        UPDATE formulas
        SET state = false
        WHERE id = $1
          AND brand_id = $2
        RETURNING *;
      `;

    const values = [data.id_formula, brandId];

    const result = await pool.query(query, values);
    console.log(result);

    return result.rows[0];
  }

  static async listStock({ brand_id, page = 1, limit = 10, name, quantity }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT
      f.id,
      f.name,
      f.final_quantity,
      f.created_at,
      f.updated_at

    FROM formulas f

    WHERE f.brand_id = $1
    AND f.state = TRUE

      AND NOT EXISTS (
        SELECT 1

        FROM formula_components fc

        JOIN components c
          ON c.id = fc.component_id

        WHERE fc.formula_id = f.id
          AND c.state = FALSE
      )
  `;

    const values = [brand_id];
    let index = 2;

    // Filter by formula name
    if (name) {
      query += ` AND f.name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    // Filter by final quantity
    if (quantity) {
      query += ` AND f.final_quantity = $${index}`;
      values.push(quantity);
      index++;
    }

    query += `
    ORDER BY f.id DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // ---------------- COUNT ----------------

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM formulas f

    WHERE f.brand_id = $1 AND f.state = TRUE

      AND NOT EXISTS (
        SELECT 1

        FROM formula_components fc

        JOIN components c
          ON c.id = fc.component_id

        WHERE fc.formula_id = f.id
          
          AND c.state = FALSE
      )
  `;

    const countValues = [brand_id];
    index = 2;

    if (name) {
      countQuery += ` AND f.name ILIKE $${index}`;
      countValues.push(`%${name}%`);
      index++;
    }

    if (quantity) {
      countQuery += ` AND f.final_quantity = $${index}`;
      countValues.push(quantity);
      index++;
    }

    const countResult = await pool.query(countQuery, countValues);

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit),
    };
  }

  static async retrieveModel({ id, brandId }) {
    const query = "SELECT * FROM formulas WHERE  id = $1 AND brand_id = $2";

    const values = [id, brandId];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async listFormulaLocation({
    brand_id,
    location_id,
    page = 1,
    limit = 10,
    name,
    quantity,
  }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT f.*
    FROM formulas f
    WHERE f.brand_id = $1
    AND f.state = TRUE
    AND NOT EXISTS (

      SELECT 1

      FROM formula_components fc

      JOIN components c
        ON c.id = fc.component_id

      LEFT JOIN stock s
        ON s.component_id = fc.component_id
       AND s.location_id = $2

      WHERE fc.formula_id = f.id

      AND (
            c.state = FALSE
         OR s.id IS NULL
         OR s.quantity_base < fc.quantity
      )

    )
  `;

    const values = [brand_id, location_id];
    let index = 3;

    // Filter by name
    if (name) {
      query += ` AND f.name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    // Filter by final quantity
    if (quantity) {
      query += ` AND f.final_quantity = $${index}`;
      values.push(quantity);
      index++;
    }

    query += `
    ORDER BY f.id DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `;

    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // ---------- COUNT QUERY ----------

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM formulas f

    WHERE f.brand_id = $1
    AND f.state = TRUE
    AND NOT EXISTS (

      SELECT 1

      FROM formula_components fc

      JOIN components c
        ON c.id = fc.component_id

      LEFT JOIN stock s
        ON s.component_id = fc.component_id
       AND s.location_id = $2

      WHERE fc.formula_id = f.id

      AND (
            c.state = FALSE
         OR s.id IS NULL
         OR s.quantity_base < fc.quantity
      )

    )
  `;

    const countValues = [brand_id, location_id];
    index = 3;

    if (name) {
      countQuery += ` AND f.name ILIKE $${index}`;
      countValues.push(`%${name}%`);
      index++;
    }

    if (quantity) {
      countQuery += ` AND f.final_quantity = $${index}`;
      countValues.push(quantity);
      index++;
    }

    const countResult = await pool.query(countQuery, countValues);

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit),
    };
  }
}
