import { pool } from "../../config/db.js";
import { StockModel } from "../../models/stock/stockModel.js";
import { StockMovementModel } from "../../models/stock/stockMovementModel.js";
import { ComponentJarStockModel } from "../../models/stock/componentJarStockModel.js";
import { JarMovementModel } from "../../models/stock/jarMovementModel.js";

// Manual bodega -> jar transfer: the physical amount staff move from the
// bulk container into the small jar they dispense from during a sale.
export class JarStockService {
  static async transferToJar({ userId, data }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 1. DISCOUNT BODEGA
      const bodega = await StockModel.discountStock(client, {
        component_id: data.component_id,
        location_id: data.location_id,
        quantity: data.quantity,
      });

      // 2. BODEGA MOVEMENT
      await StockMovementModel.createMovement(client, {
        stock_id: bodega.id,
        location_id: bodega.location_id,
        movement_type: "TRANSFER_OUT",
        quantity: data.quantity,
        unit_price: bodega.avg_price,
        total_price: Number(bodega.avg_price) * Number(data.quantity),
        reference_type: "JAR_TRANSFER",
        created_by: userId,
      });

      // 3. INCREASE JAR
      const jar = await ComponentJarStockModel.increaseStock(client, {
        component_id: data.component_id,
        location_id: data.location_id,
        quantity: data.quantity,
        userId,
      });

      // 4. JAR MOVEMENT
      await JarMovementModel.createMovement(client, {
        jar_stock_id: jar.id,
        location_id: jar.location_id,
        movement_type: "TRANSFER_IN",
        quantity: data.quantity,
        unit_price: bodega.avg_price,
        total_price: Number(bodega.avg_price) * Number(data.quantity),
        reference_type: "JAR_TRANSFER",
        created_by: userId,
      });

      await client.query("COMMIT");

      return { bodega, jar };
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
