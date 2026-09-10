import { pool } from '../../config/db.js'

export class JarMovementModel {
  static async createMovement (client, data) {
    const query = `
      INSERT INTO jar_movements (
        jar_stock_id,
        location_id,
        movement_type,
        quantity,
        unit_price,
        total_price,
        notes,
        reference_id,
        reference_type,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
      )
      RETURNING *
    `

    const values = [
      data.jar_stock_id,
      data.location_id,
      data.movement_type,
      data.quantity,
      data.unit_price,
      data.total_price,
      data.reason || null,
      data.reference_id || null,
      data.reference_type || null,
      data.created_by
    ]

    const result = await client.query(query, values)

    return result.rows[0]
  }

  static async listMovements ({
    brand_id,
    page = 1,
    limit = 10,
    location,
    movement_type,
    component_id
  }) {
    const offset = (page - 1) * limit

    let query = `
    SELECT
      jm.*,

      c.name AS component_name,

      l.name AS location_name

    FROM jar_movements jm

    JOIN component_jar_stock js
      ON js.id = jm.jar_stock_id

    JOIN components c
      ON c.id = js.component_id

    JOIN locations l
      ON l.id = jm.location_id

    WHERE c.brand_id = $1
  `

    const values = [brand_id]

    let index = 2

    if (location) {
      query += ` AND jm.location_id = $${index}`

      values.push(location)

      index++
    }

    if (movement_type) {
      query += ` AND jm.movement_type = $${index}`

      values.push(movement_type)

      index++
    }

    if (component_id) {
      query += ` AND js.component_id = $${index}`

      values.push(component_id)

      index++
    }

    query += `
    ORDER BY jm.created_at DESC

    LIMIT $${index}

    OFFSET $${index + 1}
  `

    values.push(limit, offset)

    const resultQuery = await pool.query(query, values)

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM jar_movements jm

    JOIN component_jar_stock js
      ON js.id = jm.jar_stock_id

    JOIN components c
      ON c.id = js.component_id

    JOIN locations l
      ON l.id = jm.location_id

    WHERE c.brand_id = $1
  `

    const countValues = [brand_id]

    index = 2

    if (location) {
      countQuery += ` AND jm.location_id = $${index}`

      countValues.push(location)

      index++
    }

    if (movement_type) {
      countQuery += ` AND jm.movement_type = $${index}`

      countValues.push(movement_type)

      index++
    }

    if (component_id) {
      countQuery += ` AND js.component_id = $${index}`

      countValues.push(component_id)

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
