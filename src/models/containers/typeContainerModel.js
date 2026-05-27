import { pool } from "../../config/db.js";

export class TypeContainersModel {
  static async createTypeContainer({ brand_id, name, description }) {
    const query = `INSERT INTO type_containers (brand_id, name,description) VALUES ($1,$2,$3) RETURNING *`;
    const values = [brand_id, name, description];

    const resutl = await pool.query(query, values);
    console.log(resutl);
    return resutl.rows[0];
  }

  static async deleteTypeContainer({ brand_id, id }) {
    const query = `DELETE FROM type_containers WHERE brand_id =$1 AND id = $2 RETURNING *`;
    const values = [brand_id, id];

    const resutl = await pool.query(query, values);
    return resutl.rows[0];
  }
}
