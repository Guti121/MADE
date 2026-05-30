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

    const query = `SELECT * FROM containers_stock WHERE id = $1 AND location_id = $2 AND container_id = $3`;
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
}
