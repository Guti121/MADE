import { pool } from "../../config/db.js";
import { StockContainerModel } from "../../models/containers/stockContainerModel.js";
import { StockContainerMovementModel } from "../../models/containers/stockContainerMovement.js";
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
export class StockContainerService {
  static async createStockContainer({ userId, params, unitsPrice }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. CREATE STOCK
      console.log("entre 1");
      const stock = await StockContainerModel.createStockContainer(client, {
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
      console.log(stock, "stock-----");
      await StockContainerMovementModel.createMovement(client, {
        stock_id: stock.id,
        container_id: params.container_id,
        location_id: stock.location_id,

        movement_type: "INITIAL_STOCK",

        quantity: stock.quantity,

        unit_price: stock.avg_price,

        total_price: stock.quantity * stock.avg_price,

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

  static async updateStockContainer({
    stockId,
    userId,
    location_id,
    container_id,
    unitsPrice,
    AVGPrice,
  }) {
    console.log("user", userId);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const stock = await StockContainerModel.updateStockContainer(client, {
        stockId,
        unitsPrice,
        location_id,
        container_id,
        AVGPrice,
        userId,
      });

      await StockContainerMovementModel.createMovement(client, {
        stock_id: stock.id,
        container_id,
        location_id: stock.location_id,

        movement_type: "PURCHASE",

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

  static async registerLossContainer({ stock, smallSizeLoss, userId, data }) {
    const client = await pool.connect();
    try {
      console.log("entre", data);
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const result = await StockContainerModel.registerLossContainer(client, {
        quantity: smallSizeLoss,
        userId,
        stockId: stock.id,
        container_id: stock.container_id,
        location_id: stock.location_id,
      });
      if (!result) {
        throw new Error("Error updating stock");
      }
      await StockContainerMovementModel.createMovement(client, {
        stock_id: stock.id,

        container_id: stock.container_id,

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

  static async registerAdjustContainer({
    stock,
    smallSizeAdjust,
    userId,
    data,
  }) {
    const client = await pool.connect();
    try {
      console.log("entre", data);
      await client.query("BEGIN");

      // 1. CREATE STOCK
      const result = await StockContainerModel.registerLossContainer(client, {
        quantity: smallSizeAdjust,
        userId,
        stockId: stock.id,
        container_id: stock.container_id,
        location_id: stock.location_id,
      });
      if (!result) {
        throw new Error("Error updating stock");
      }
      await StockContainerMovementModel.createMovement(client, {
        stock_id: stock.id,

        container_id: stock.container_id,

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
