import { pool } from "../../config/db.js";
import { StockModel } from "../../models/stock/StockModel.js";
import { StockMovementModel } from "../../models/stock/stockMovementModel.js";

//CREATE INITIAL MOVEMENT
// | movement_type |
// | ------------- |
// | INITIAL_STOCK |
// | PURCHASE      |
// | SALE          |
// | ADJUSTMENT  +  |
// | ADJUSTMENT  -  |
// | LOSS          |d
// | RETURN        |

//services for stock , creation , adjustment , loss stock ...
export class StockService {
  static async createStock({ userId, params, unitsPrice }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const stock = await StockModel.createStock(client, {
        userId,
        params,
        unitsPrice,
      });

      // 2. CREATE INITIAL MOVEMENT
      // | movement_type |
      // | ------------- |
      // | INITIAL_STOCK |
      // | PURCHASE      |
      // | SALE          |
      // | ADJUSTMENT    |
      // | LOSS          |
      // | RETURN        |

      await StockMovementModel.createMovement(client, {
        stock_id: stock.id,
        location_id: stock.location_id,

        movement_type: "INITIAL_STOCK",

        quantity: stock.quantity_base,

        unit_price: stock.avg_price,

        total_price: stock.quantity_base * stock.avg_price,

        created_by: userId,
      });

      await client.query("COMMIT");

      return stock;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStock({
    stockId,
    userId,
    location_id,
    component_id,
    unitsPrice,
    AVGPrice,
  }) {
    console.log("user", userId);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const stock = await StockModel.updateStock(client, {
        stockId,
        unitsPrice,
        location_id,
        component_id,
        AVGPrice,
        userId,
      });

      await StockMovementModel.createMovement(client, {
        stock_id: stock.id,

        movement_type: "PURCHASE",
        location_id: location_id,

        quantity: unitsPrice.quantityInBase,

        unit_price: unitsPrice.purchaseUnitPrice,

        total_price: unitsPrice.quantityInBase * unitsPrice.purchaseUnitPrice,

        created_by: userId,
      });

      await client.query("COMMIT");

      return stock;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }

  static async registerLoss({ stock, smallSizeLoss, userId, data }) {
    const client = await pool.connect();
    try {
      console.log("entre", data);
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const result = await StockModel.registerLoss(client, {
        quantity: smallSizeLoss,
        userId,
        stockId: stock.id,
        component_id: stock.component_id,
        location_id: stock.location_id,
      });
      if (!result) {
        throw new Error("Error updating stock");
      }
      await StockMovementModel.createMovement(client, {
        stock_id: stock.id,

        component_id: stock.component_id,

        location_id: stock.location_id,

        movement_type: "LOSS",

        quantity: Number(result.quantity_base) - Number(stock.quantity_base),

        unit_price: stock.avg_price,

        total_price: Number(stock.avg_price) * Number(result.quantity_base),

        reason: data.reason,

        created_by: userId,
      });
      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }

  static async registerAdjust({ stock, smallSizeAdjust, userId, data }) {
    const client = await pool.connect();
    try {
      console.log("entre", data);
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const result = await StockModel.registerAdjust(client, {
        quantity: smallSizeAdjust,
        userId,
        stockId: stock.id,
        component_id: stock.component_id,
        location_id: stock.location_id,
      });
      if (!result) {
        throw new Error("Error updating stock");
      }
      await StockMovementModel.createMovement(client, {
        stock_id: stock.id,

        component_id: stock.component_id,

        location_id: stock.location_id,

        movement_type: "ADJUSTMENT",

        quantity: Number(result.quantity_base) - Number(stock.quantity_base),

        unit_price: stock.avg_price,

        total_price: Number(stock.avg_price) * Number(result.quantity_base),

        reason: data.reason,

        created_by: userId,
      });
      await client.query("COMMIT");

      return result;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
