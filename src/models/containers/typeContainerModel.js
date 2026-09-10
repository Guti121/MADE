import { pool } from '../../config/db.js'

export class TypeContainersModel {
  static async createTypeContainer ({ brand_id, name, description }) {
    const query = 'INSERT INTO type_containers (brand_id, name,description) VALUES ($1,$2,$3) RETURNING *'
    const values = [brand_id, name, description]

    const resutl = await pool.query(query, values)
    return resutl.rows[0]
  }

  static async deleteTypeContainer ({ brand_id, id }) {
    const query = 'DELETE FROM type_containers WHERE brand_id =$1 AND id = $2 RETURNING *'
    const values = [brand_id, id]

    const resutl = await pool.query(query, values)
    return resutl.rows[0]
  }

  static async listTypeContainer ({ brand_id, page = 1, limit = 10, name }) {
    const offset = (page - 1) * limit

    let query = `
    SELECT * 
    FROM type_Containers 
    WHERE brand_id = $1
  `

    const values = [brand_id]
    let index = 2

    // 🔍 optional filters
    if (name) {
      query += ` AND name ILIKE $${index}`
      values.push(`%${name}%`)
      index++
    }

    query += ` ORDER BY id DESC LIMIT $${index} OFFSET $${index + 1}`
    values.push(limit, offset)

    const resultQuery = await pool.query(query, values)

    // count query (same filters!)
    let countQuery = `
    SELECT COUNT(*) AS total 
    FROM type_Containers 
    WHERE brand_id = $1
  `

    const countValues = [brand_id]
    index = 2

    if (name) {
      countQuery += ` AND name ILIKE $${index}`
      countValues.push(`%${name}%`)
      index++
    }

    const countResult = await pool.query(countQuery, countValues)

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit)
    }
  }

  static async updateTypeContainer ({ brand_id, name, id, description }) {
    const query = `
        UPDATE type_Containers
        SET 
          name = COALESCE($1, name),
          description =COALESCE($4,description) 
        WHERE brand_id=$2 AND id=$3
        RETURNING *;
      `

    const values = [name, brand_id, id, description]

    const result = await pool.query(query, values)

    return result.rows[0]
  }
}
