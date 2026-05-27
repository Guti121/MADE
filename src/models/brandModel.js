import { pool } from "../config/db.js";

export class BrandModel {
  static async createBrand({ name, userId, weight }) {
    const query = `INSERT INTO brands (name , user_id, weight) 
    VALUES ($1, $2, $3)
    RETURNING *;`;

    const values = [name, userId, weight];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  static async deleteBrand({ userId }) {
    const query = `
      DELETE FROM brands 
      WHERE user_id = $1 
      RETURNING *;
    `;

    const values = [userId];

    const result = await pool.query(query, values);

    return result.rows[0]; // ✅ now works
  }

  static async updateBrand({ userId, name, weight }) {
    const query = `
        UPDATE brands
        SET 
          name = COALESCE($1, name),
          weight = COALESCE($2, weight)
        WHERE user_id = $3
        RETURNING *;
      `;

    const values = [name, weight, userId];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async viewBrand({ userId }) {
    const query = `SELECT * FROM brands WHERE user_id = $1`;
    const values = [userId];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}
