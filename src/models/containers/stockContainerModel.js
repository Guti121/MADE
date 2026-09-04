import { pool } from "../../config/db.js";

export class StockContainerModel {
  static async createStockContainer(client, { userId, params, unitsPrice }) {
    const query = `INSERT INTO containers_stock (container_id,Location_id,Quantity,Avg_price,Wholesale_price,Consumer_price,created_by,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`;
    console.log(params, "params 1");
    const values = [
      params.container_id,
      params.location_id,
      unitsPrice.quantityInBase,
      unitsPrice.purchaseUnitPrice,
      unitsPrice.wholesaleUnitPrice,
      unitsPrice.consumerUnitPrice,
      userId,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }

  static async deleteStockContainer({ data }) {
    const query = `DELETE FROM containers_stock WHERE id = $1 AND location_id = $2 RETURNING *`;
    const values = [data.id_stock, data.id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async retrieveStockContainer({ stockId, location_id, container_id }) {
    console.log(stockId, location_id);

    const query = `
      SELECT
          cs.*,

          c.name AS container_name,

          tc.name AS type_container_name,

          l.name AS location_name

      FROM containers_stock cs

      JOIN containers c
          ON c.id = cs.container_id

      JOIN type_containers tc
          ON tc.id = c.type_container_id

      JOIN locations l
          ON l.id = cs.location_id

      WHERE cs.id = $1
        AND cs.location_id = $2
        AND cs.container_id = $3
        AND c.state = true;
      `;
    const values = [stockId, location_id, container_id];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStockContainer(
    client,
    { stockId, unitsPrice, location_id, container_id, AVGPrice, userId },
  ) {
    console.log(
      "ssssssssssssssss",
      unitsPrice.quantityInBase,
      AVGPrice,
      unitsPrice.wholesaleUnitPrice,
      unitsPrice.consumerUnitPrice,
      location_id,
      userId,
      container_id,
    );
    const query = `
    UPDATE containers_stock
        SET 
          Quantity = $1, 
          Avg_price =$2, 
          Wholesale_price = COALESCE($3, Wholesale_price),
          Consumer_price = $4,
          updated_by =$5,
          updated_at= NOW()
        WHERE Location_id = $6 AND id =$7 AND container_id =$8

        RETURNING*`;

    const values = [
      AVGPrice.newQuantity,
      AVGPrice.newAvgPrice,
      unitsPrice.wholesaleUnitPrice,
      unitsPrice.consumerUnitPrice,
      userId,
      location_id,
      stockId,
      container_id,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }
  static async registerLossContainer(
    client,
    { quantity, userId, stockId, container_id, location_id },
  ) {
    const query = `
    UPDATE containers_stock
    SET
      quantity = $1,
      updated_by = $2,
      updated_at = NOW()

    WHERE id = $3 AND container_id =$4 AND Location_id = $5

    RETURNING *
  `;
    console.log(
      "cuantity perdida",
      quantity,
      userId,
      stockId,
      container_id,
      location_id,
      "as",
    );
    const values = [quantity, userId, stockId, container_id, location_id];

    const result = await client.query(query, values);
    return result.rows[0];
  }
  static async retrieveByContainer({ container_id, location_id }) {
    const query = `
    SELECT cs.*, c.name AS container_name
    FROM containers_stock cs
    JOIN containers c ON c.id = cs.container_id
    WHERE cs.container_id = $1
      AND cs.location_id = $2
  `;

    const values = [container_id, location_id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }
  static async discountStock(client, { container_id, location_id, quantity }) {
    const stockQuery = `
    SELECT *
    FROM containers_stock
    WHERE container_id = $1
      AND location_id = $2
    FOR UPDATE
  `;

    const stockResult = await client.query(stockQuery, [
      container_id,
      location_id,
    ]);

    const stock = stockResult.rows[0];

    if (!stock) {
      throw new Error(
        `Container stock not found for container ${container_id}`,
      );
    }

    const currentQuantity = Number(stock.quantity);

    const quantityToDiscount = Number(quantity);

    if (quantityToDiscount > currentQuantity) {
      throw new Error(`Insufficient stock for container ${container_id}`);
    }

    const query = `
    UPDATE containers_stock
    SET quantity =
      quantity - $1
    WHERE container_id = $2
      AND location_id = $3
    RETURNING *
  `;

    const result = await client.query(query, [
      quantityToDiscount,
      container_id,
      location_id,
    ]);

    return result.rows[0];
  }

  static async listStockContainer({
    brand_id,
    page = 1,
    limit = 10,
    name,
    location,
    type_container,
  }) {
    console.log(type_container, "tyoeeeeeeee");
    const offset = (page - 1) * limit;

    let query = `
    SELECT
      s.*,

      c.name AS container_name,
      
      c.capacity AS capacity,
      c.unit AS unit,
      tc.name AS type_container_name,

      l.name AS location_name

    FROM containers_stock s

    JOIN containers c
      ON c.id = s.container_id

    JOIN type_containers tc
      ON tc.id = c.type_container_id

    JOIN locations l
      ON l.id = s.location_id

    WHERE c.brand_id = $1
      AND c.state = true 
  `;

    const values = [brand_id];

    let index = 2;

    // FILTER BY COMPONENT NAME
    if (name) {
      query += ` AND c.name ILIKE $${index}`;

      values.push(`%${name}%`);

      index++;
    }

    // FILTER BY LOCATION
    if (location) {
      query += ` AND s.location_id = $${index}`;

      values.push(location);

      index++;
    }

    // FILTER BY TYPE COMPONENT
    if (type_container) {
      query += ` AND c.type_container_id = $${index}`;

      values.push(type_container);

      index++;
    }

    query += `
    ORDER BY s.updated_at DESC

    LIMIT $${index}

    OFFSET $${index + 1}
  `;

    values.push(limit, offset);

    const resultQuery = await pool.query(query, values);

    // COUNT QUERY

    let countQuery = `
    SELECT COUNT(*) AS total

    FROM containers_stock s

    JOIN containers c
      ON c.id = s.container_id

    JOIN type_containers tc
      ON tc.id = c.type_container_id

    JOIN locations l
      ON l.id = s.location_id

    WHERE c.brand_id = $1
      AND c.state = true
  `;

    const countValues = [brand_id];

    index = 2;

    if (name) {
      countQuery += `
      AND c.name ILIKE $${index}
    `;

      countValues.push(`%${name}%`);

      index++;
    }

    if (location) {
      countQuery += `
      AND s.location_id = $${index}
    `;

      countValues.push(location);

      index++;
    }

    if (type_container) {
      countQuery += `
      AND c.type_container_id = $${index}
    `;

      countValues.push(type_container);

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
