import { pool } from "../../config/db.js";

export class ComponentModel {
  static async createComponent({ brand_id, params }) {
    console.log(params, brand_id, "--------------------------------");
    const query =
      "INSERT INTO components (name , type_Component_id, brand_id) VALUES ($1,$2,$3) RETURNING *";
    const values = [params.name, params.type_component, brand_id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async updateComponent({ brandId, params }) {
    const query = `
    UPDATE components
    SET 
      name = COALESCE($1, name),
      type_component_id = COALESCE($2, type_component_id)
    WHERE brand_id = $3 
      AND id = $4
    RETURNING *;
  `;

    const values = [params.name, params.type_component, brandId, params.id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }
  static async deleteComponent({ brandId, params }) {
    const query = `DELETE FROM components 
      WHERE id = $1 AND brand_id = $2
      RETURNING *;`;

    const values = [params.id, brandId];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async listComponent({ brand_id, page = 1, limit = 10, name,type_component }) {
    const offset = (page - 1) * limit;
    console.log(brand_id, (page = 1), (limit = 10), name);
    let query = `SELECT * 
    FROM components 
    WHERE brand_id = $1`;

    const values = [brand_id];
    let index = 2;

    if (name) {
      query += ` AND name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    if (type_component) {
      query += ` AND type_component_id = $${index}`;
      values.push(type_component);
      index++;
    }

    query += ` ORDER BY id DESC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // count query (same filters!)
    let countQuery = `
        SELECT COUNT(*) AS total 
        FROM components 
        WHERE brand_id = $1
      `;

    const countValues = [brand_id];
    index = 2;
    console.log("SEGUIMOS BIEN 1", resultQuery);

    if (name) {
      countQuery += ` AND name ILIKE $${index}`;
      countValues.push(`%${name}%`);
      index++;
    }

    const countResult = await pool.query(countQuery, countValues);
    console.log("SEGUIMOS BIEN 2", countResult);

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit),
    };
  }
}
