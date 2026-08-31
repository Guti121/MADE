import { pool } from "../../config/db.js";

export class TypeComponentesModel {
  // type_components is a global catalog shared by every brand/location.
  // It is managed by SQL/seed only, so this model exposes read access only.
  static async listTypeComponent({ page = 1, limit = 10, name }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT *
    FROM type_components
    WHERE 1 = 1
  `;

    const values = [];
    let index = 1;

    // 🔍 optional filter
    if (name) {
      query += ` AND name ILIKE $${index}`;
      values.push(`%${name}%`);
      index++;
    }

    query += ` ORDER BY name ASC LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // count query (same filters!)
    let countQuery = `
    SELECT COUNT(*) AS total
    FROM type_components
    WHERE 1 = 1
  `;

    const countValues = [];
    index = 1;

    if (name) {
      countQuery += ` AND name ILIKE $${index}`;
      countValues.push(`%${name}%`);
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
