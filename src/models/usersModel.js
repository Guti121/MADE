import e from "express";
import { pool } from "../config/db.js";

export class UserModel {
  //Create user
  static async createUser({ name, email, password, lastname }) {
    const query = `
      INSERT INTO users (name, email, password, location_id, role,lastname)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [name, email, password, null, "owner", lastname];
    console.log(values.length);
    try {
      const result = await pool.query(query, values);
      console.log(result);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Confirm credentials or confirm if email exist for register
  static async loginUser({ email }) {
    const query = "SELECT * FROM users WHERE email = $1 AND state = true";
    const values = [email];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async saveRefreshToken({ user, refreshToken }) {
    const query = `INSERT INTO user_sessions (user_id, refresh_token)
     VALUES ($1, $2)`;

    const values = [user.id, refreshToken];
    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async refreshToken({ decoded, token }) {
    const query = `SELECT * FROM user_sessions WHERE refresh_token = $1 AND user_id = $2`;
    console.log(decoded);
    const values = [token, decoded.id];
    const result = await pool.query(query, values);
    console.log(result.rows[0]);
    return result.rows[0];
  }

  static async deleteSession({ token }) {
    const query = `DELETE FROM user_sessions 
      WHERE refresh_token = $1 
      RETURNING *;`;
    console.log(token, "token");
    const values = [token];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
