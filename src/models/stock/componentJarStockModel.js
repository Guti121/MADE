import { pool } from '../../config/db.js'
import { AppError } from '../../helpers/AppError.js'

export class ComponentJarStockModel {
  // retrieve for Sale / transfer
  static async retrieveByComponent ({ component_id, location_id }) {
    const query =
      'SELECT * FROM component_jar_stock WHERE component_id = $1 AND location_id = $2 AND state = true'
    const values = [component_id, location_id]

    const result = await pool.query(query, values)

    return result.rows[0]
  }

  static async discountStock (client, { component_id, location_id, quantity }) {
    const stockQuery = `
    SELECT *
    FROM component_jar_stock
    WHERE component_id = $1
      AND location_id = $2
      AND state = true
    FOR UPDATE
  `

    const stockResult = await client.query(stockQuery, [
      component_id,
      location_id
    ])

    const stock = stockResult.rows[0]

    if (!stock) {
      throw new AppError(`Jar stock not found for component ${component_id}`)
    }

    const currentQuantity = Number(stock.quantity_base)

    const quantityToDiscount = Number(quantity)

    if (quantityToDiscount > currentQuantity) {
      throw new AppError(`Insufficient jar stock for component ${component_id}`)
    }

    const query = `
    UPDATE component_jar_stock
    SET quantity_base =
      quantity_base - $1
    WHERE component_id = $2
      AND location_id = $3
      AND state = true
    RETURNING *
  `

    const result = await client.query(query, [
      quantityToDiscount,
      component_id,
      location_id
    ])

    return result.rows[0]
  }

  // Upsert: creates the jar row on the first transfer, otherwise adds to it.
  static async increaseStock (
    client,
    { component_id, location_id, quantity, userId }
  ) {
    const query = `
    INSERT INTO component_jar_stock (component_id, location_id, quantity_base, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $4)
    ON CONFLICT (component_id, location_id)
    DO UPDATE SET
      quantity_base = component_jar_stock.quantity_base + EXCLUDED.quantity_base,
      updated_by = $4,
      updated_at = NOW()
    RETURNING *
  `

    const values = [component_id, location_id, quantity, userId]

    const result = await client.query(query, values)

    return result.rows[0]
  }

  static async listJarStock ({
    brand_id,
    page = 1,
    limit = 10,
    name,
    location
  }) {
    const offset = (page - 1) * limit

    let query = `
    SELECT
      js.*,

      c.name AS component_name,

      l.name AS location_name

    FROM component_jar_stock js

    JOIN components c
      ON c.id = js.component_id

    JOIN locations l
      ON l.id = js.location_id

    WHERE c.brand_id = $1
      AND js.state = true
      AND c.state = true
  `

    const values = [brand_id]

    let index = 2

    if (name) {
      query += ` AND c.name ILIKE $${index}`

      values.push(`%${name}%`)

      index++
    }

    if (location) {
      query += ` AND js.location_id = $${index}`

      values.push(location)

      index++
    }

    query += `
    ORDER BY js.updated_at DESC

    LIMIT $${index}

    OFFSET $${index + 1}
  `

    values.push(limit, offset)

    const resultQuery = await pool.query(query, values)

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM component_jar_stock js

    JOIN components c
      ON c.id = js.component_id

    JOIN locations l
      ON l.id = js.location_id

    WHERE c.brand_id = $1
      AND js.state = true
      AND c.state = true
  `

    const countValues = [brand_id]

    index = 2

    if (name) {
      countQuery += ` AND c.name ILIKE $${index}`

      countValues.push(`%${name}%`)

      index++
    }

    if (location) {
      countQuery += ` AND js.location_id = $${index}`

      countValues.push(location)

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
