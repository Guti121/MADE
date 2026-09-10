import { pool } from '../config/db.js'

export class LocationModel {
  static async createLocation ({ name, address, brand_id }) {
    const query = `
    INSERT INTO locations (name, address, brand_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `

    const values = [name, address, brand_id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }

  static async deleteLocation ({ brand_id, locationId }) {
    const query = 'DELETE FROM locations WHERE brand_id = $1 AND id = $2 RETURNING *;'

    const values = [brand_id, locationId.id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }

  static async updateLocation ({ valuesBody, brand_id }) {
    const query = `UPDATE locations SET name = COALESCE($1, name),
          address = COALESCE($2, address) WHERE id = $3 AND brand_id = $4
        RETURNING *;`

    const values = [
      valuesBody.name, // $1
      valuesBody.address, // $2
      valuesBody.id, // $3 (id goes here)
      brand_id // $4 (brand_id goes here)
    ]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  static async viewLocation ({ brand_id, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit

    const query = 'SELECT * FROM locations WHERE brand_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3'
    const countQuery = 'SELECT COUNT (*) AS TOTAL FROM locations  WHERE brand_id = $1 '

    const values = [brand_id, limit, offset]

    const resultQuery = await pool.query(query, values)

    const countResult = await pool.query(countQuery, [brand_id])

    return {
      data: resultQuery.rows,
      total: Number(countResult.rows[0].total),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult.rows[0].total) / limit)
    }
  }

  static async retrieveLocation ({ id, brand_id }) {
    const query = 'SELECT * FROM locations WHERE brand_id= $1 AND id = $2'

    const values = [brand_id, id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }
}
