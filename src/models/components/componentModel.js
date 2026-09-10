import { pool } from '../../config/db.js'
import { AppError } from '../../helpers/AppError.js'

export class ComponentModel {
  static async createComponent ({ brand_id, params }) {
    const query =
      'INSERT INTO components (name , type_Component_id, brand_id) VALUES ($1,$2,$3) RETURNING *'
    const values = [params.name, params.type_component, brand_id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }

  static async updateComponent ({ brandId, params }) {
    const query = `
    UPDATE components
    SET 
      name = COALESCE($1, name),
      type_component_id = COALESCE($2, type_component_id)
      WHERE brand_id = $3   
      AND id = $4 AND state = true
      RETURNING *;
  `

    const values = [params.name, params.type_component, brandId, params.id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }

  static async deleteComponent ({ brandId, params }) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const componentResult = await client.query(
        `
      UPDATE components
      SET state = FALSE
      WHERE id = $1
        AND brand_id = $2
      RETURNING *;
      `,
        [params.id, brandId]
      )

      if (componentResult.rowCount === 0) {
        throw new AppError('Component not found')
      }

      await client.query(
        `
      UPDATE stock
      SET state = FALSE
      WHERE component_id = $1;
      `,
        [params.id]
      )

      await client.query('COMMIT')

      return componentResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async listComponent ({
    brand_id,
    page = 1,
    limit = 10,
    name,
    type_component
  }) {
    const offset = (page - 1) * limit

    // MAIN QUERY
    let query = `
    SELECT 
      c.*,
      tc.name AS type_component_name
    FROM components c
    JOIN type_components tc
      ON c.type_component_id = tc.id
    WHERE c.brand_id = $1 AND state = true
  `

    const values = [brand_id]

    let index = 2

    // FILTER BY COMPONENT NAME
    if (name) {
      query += ` AND c.name ILIKE $${index}`
      values.push(`%${name}%`)
      index++
    }

    // FILTER BY TYPE COMPONENT NAME
    if (type_component) {
      query += ` AND c.type_component_id = $${index}`
      values.push(type_component)
      index++
    }

    // PAGINATION
    query += `
    ORDER BY c.id DESC
    LIMIT $${index}
    OFFSET $${index + 1}
  `

    values.push(limit, offset)

    const resultQuery = await pool.query(query, values)

    // COUNT QUERY
    let countQuery = `
    SELECT COUNT(*) AS total
    FROM components c
    JOIN type_components tc
      ON c.type_component_id = tc.id
    WHERE c.brand_id = $1 AND state = true
  `

    const countValues = [brand_id]

    index = 2

    // FILTER BY COMPONENT NAME
    if (name) {
      countQuery += ` AND c.name ILIKE $${index}`
      countValues.push(`%${name}%`)
      index++
    }

    // FILTER BY TYPE COMPONENT NAME
    if (type_component) {
      countQuery += ` AND c.type_component_id = $${index}`
      countValues.push(type_component)
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
}
