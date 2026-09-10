import { pool } from '../../config/db.js'

export class StockContainerMovementModel {
  static async createMovement (client, data) {
    const query = `
      INSERT INTO container_movements (
        container_stock_id,
        container_id,
        location_id,
        movement_type,
        quantity,
        unit_price,
        total_price,
        reason,
        reference_id,
        reference_type,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *
    `

    const values = [
      data.stock_id,
      data.container_id,
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
    container_id
  }) {
    const offset = (page - 1) * limit

    let query = `
    SELECT
      cm.*,

      c.name AS container_name,

      l.name AS location_name

    FROM container_movements cm

    JOIN containers c
      ON c.id = cm.container_id

    JOIN locations l
      ON l.id = cm.location_id

    WHERE c.brand_id = $1
  `

    const values = [brand_id]

    let index = 2

    // FILTER BY LOCATION
    if (location) {
      query += ` AND cm.location_id = $${index}`

      values.push(location)

      index++
    }

    // FILTER BY MOVEMENT TYPE
    if (movement_type) {
      query += ` AND cm.movement_type = $${index}`

      values.push(movement_type)

      index++
    }

    // FILTER BY CONTAINER
    if (container_id) {
      query += ` AND cm.container_id = $${index}`

      values.push(container_id)

      index++
    }

    query += `
    ORDER BY cm.created_at DESC

    LIMIT $${index}

    OFFSET $${index + 1}
  `

    values.push(limit, offset)

    const resultQuery = await pool.query(query, values)

    // COUNT QUERY

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM container_movements cm

    JOIN containers c
      ON c.id = cm.container_id

    JOIN locations l
      ON l.id = cm.location_id

    WHERE c.brand_id = $1
  `

    const countValues = [brand_id]

    index = 2

    if (location) {
      countQuery += `
      AND cm.location_id = $${index}
    `

      countValues.push(location)

      index++
    }

    if (movement_type) {
      countQuery += `
      AND cm.movement_type = $${index}
    `

      countValues.push(movement_type)

      index++
    }

    if (container_id) {
      countQuery += `
      AND cm.container_id = $${index}
    `

      countValues.push(container_id)

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
