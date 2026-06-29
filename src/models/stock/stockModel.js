import { pool } from "../../config/db.js";

export class StockModel {
  static async createStock(client, { userId, params, unitsPrice }) {
    const query = `INSERT INTO stock (Component_id,Location_id,Quantity_base,Avg_price,Wholesale_price,Consumer_price,created_by,updated_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`;

    const values = [
      params.component_id,
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

  static async deleteStock({ data }) {
    const query = `UPDATE stock
    SET state = FALSE
    WHERE id = $1 AND location_id = $2 AND state RETURNING *;`;
    const values = [data.id_stock, data.id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async RetrieveStock({ stockId, location_id, component_id }) {
    console.log(stockId, location_id);

    const query = `SELECT * FROM stock WHERE id = $1 AND location_id = $2 AND component_id = $3
      AND state = true
    `;
    const values = [stockId, location_id, component_id];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStock(
    client,
    { stockId, unitsPrice, location_id, component_id, AVGPrice, userId },
  ) {
    console.log(
      "ssssssssssssssss",
      unitsPrice.quantityInBase,
      AVGPrice,
      unitsPrice.wholesaleUnitPrice,
      unitsPrice.consumerUnitPrice,
      location_id,
      userId,
      component_id,
    );
    const query = `
    UPDATE stock
        SET 
          Quantity_base = $1, 
          Avg_price =$2, 
          Wholesale_price = COALESCE($3, Wholesale_price),
          Consumer_price = $4,
          updated_by =$5,
          updated_at= NOW()
        WHERE Location_id = $6 AND id =$7 AND component_id =$8 AND state = true


        RETURNING*`;

    const values = [
      AVGPrice.newQuantity,
      AVGPrice.newAvgPrice,
      unitsPrice.wholesaleUnitPrice,
      unitsPrice.consumerUnitPrice,
      userId,
      location_id,
      stockId,
      component_id,
    ];

    const result = await client.query(query, values);

    return result.rows[0];
  }
  static async registerLoss(
    client,
    { quantity, userId, stockId, component_id, location_id },
  ) {
    const query = `
    UPDATE stock
    SET
      quantity_base = $1,
      updated_by = $2,
      updated_at = NOW()

    WHERE id = $3 AND component_id =$4 AND Location_id = $5
    AND state = true

    RETURNING *
  `;
    console.log(
      "cuantity perdida",
      quantity,
      userId,
      stockId,
      component_id,
      location_id,
      "as",
    );
    const values = [quantity, userId, stockId, component_id, location_id];

    const result = await client.query(query, values);
    return result.rows[0];
  }

  static async registerAdjust(
    client,
    { quantity, userId, stockId, component_id, location_id },
  ) {
    const query = `
    UPDATE stock
    SET
      quantity_base = $1,
      updated_by = $2,
      updated_at = NOW()

    WHERE id = $3 AND component_id =$4 AND Location_id = $5 AND state = true


    RETURNING *
  `;
    console.log(
      "cuantity perdida",
      quantity,
      userId,
      stockId,
      component_id,
      location_id,
      "as",
    );
    const values = [quantity, userId, stockId, component_id, location_id];

    const result = await client.query(query, values);
    return result.rows[0];
  }
  //For validation Updates
  static async retrieveStock({ stock_id, location_id }) {
    const query = `SELECT
      s.*,

      c.name AS component_name,

      tc.name AS type_component_name,

      l.name AS location_name

    FROM stock s

    JOIN components c
      ON c.id = s.component_id

    JOIN type_components tc
      ON tc.id = c.type_component_id

    JOIN locations l
      ON l.id = s.location_id

    WHERE s.id = $1 AND l.id = $2
      AND c.state = true 
  `;

    const values = [stock_id, location_id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  //retrieve for Sale
  static async retrieveStockByComponent({ component_id, location_id }) {
    const query =
      "SELECT * FROM stock WHERE component_id = $1 AND location_id = $2  AND state = true ";
    const values = [component_id, location_id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async discountStock(client, { component_id, location_id, quantity }) {
    const stockQuery = `
    SELECT *
    FROM stock
    WHERE component_id = $1
      AND location_id = $2 
      AND state = true
    FOR UPDATE
  `;

    const stockResult = await client.query(stockQuery, [
      component_id,
      location_id,
    ]);

    const stock = stockResult.rows[0];

    if (!stock) {
      throw new Error(`Stock not found for component ${component_id}`);
    }

    const currentQuantity = Number(stock.quantity_base);

    const quantityToDiscount = Number(quantity);

    if (quantityToDiscount > currentQuantity) {
      throw new Error(`Insufficient stock for component ${component_id}`);
    }

    const query = `
    UPDATE stock
    SET quantity_base =
      quantity_base - $1
    WHERE component_id = $2
      AND location_id = $3 
      AND state = true
    RETURNING *
  `;

    const result = await client.query(query, [
      quantityToDiscount,
      component_id,
      location_id,
    ]);
    console.log(result.rows[0]);
    return result.rows[0];
  }

  static async listStock({
    brand_id,
    page = 1,
    limit = 10,
    name,
    location,
    type_component,
  }) {
    const offset = (page - 1) * limit;

    let query = `
    SELECT
      s.*,

      c.name AS component_name,

      tc.name AS type_component_name,

      l.name AS location_name

    FROM stock s

    JOIN components c
      ON c.id = s.component_id

    JOIN type_components tc
      ON tc.id = c.type_component_id

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
    if (type_component) {
      query += ` AND c.type_component_id = $${index}`;

      values.push(type_component);

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

    FROM stock s

    JOIN components c
      ON c.id = s.component_id

    JOIN type_components tc
      ON tc.id = c.type_component_id

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

    if (type_component) {
      countQuery += `
      AND c.type_component_id = $${index}
    `;

      countValues.push(type_component);

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
