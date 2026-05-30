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
    const query = `DELETE FROM stock WHERE id = $1 AND location_id = $2 RETURNING *`;
    const values = [data.id_stock, data.id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }

  static async RetrieveStock({ stockId, location_id, component_id }) {
    console.log(stockId, location_id);

    const query = `SELECT * FROM stock WHERE id = $1 AND location_id = $2 AND component_id = $3`;
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
        WHERE Location_id = $6 AND id =$7 AND component_id =$8

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

    WHERE id = $3 AND component_id =$4 AND Location_id = $5

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

  static async retrieveStock({ stock_id, location_id }) {
    const query = "SELECT * FROM stock WHERE id = $1 AND location_id = $2";
    const values = [stock_id, location_id];

    const result = await pool.query(query, values);

    return result.rows[0];
  }
}
