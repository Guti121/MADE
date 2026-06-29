import { SaleItemModel } from "../../models/sales/SaleItemModel.js";
import { SaleItemComponentModel } from "../../models/sales/SaleItemComponentModel.js";
import { SaleItemContainerModel } from "../../models/sales/SaleItemContainerModel.js";

import { StockModel } from "../../models/stock/stockModel.js";
import { StockContainerModel } from "../../models/containers/stockContainerModel.js";

import { StockMovementModel } from "../../models/stock/StockMovementModel.js";
import { SaleModel } from "../../models/sales/saleModel.js";
import { pool } from "../../config/db.js";

export class SaleTransactionService {
  static async createSale({ userId, data }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // CREATE SALE
      const sale = await SaleModel.createSale(client, {
        ...data,
        user_id: userId,
        created_by: userId,
      });

      // PROCESS ITEMS
      for (const item of data.sales_items) {
        const saleItem = await SaleItemModel.createSaleItem(client, {
          sale_id: sale.id,
          formula_id: item.formula_id,
          formula_name_snapshot: item.formula_name_snapshot,
          quantity: item.quantity,
          subtotal: item.subtotal,
          discount: item.discount,
          tax: item.tax,
          total_cost: item.total_cost,
          created_by: userId,
        });

        // COMPONENTS
        for (const component of item.sales_components) {
          await SaleItemComponentModel.createComponent(client, {
            sale_item_id: saleItem.id,
            component_id: component.component_id,
            component_name_snapshot: component.component_name_snapshot,
            quantity_used: component.quantity_used,
            unit_cost: component.unit_cost,
            unit_price: component.unit_price,
            total_cost: component.total_cost,
            total_price: component.total_price,
          });

          // DISCOUNT STOCK
          const discountStock = await StockModel.discountStock(client, {
            component_id: component.component_id,
            location_id: data.location_id,
            quantity: component.quantity_used,
          });
          console.log(component.stock_id);
          // STOCK MOVEMENT
          await StockMovementModel.createMovement(client, {
            stock_id: discountStock.id,
            location_id: discountStock.location_id,
            movement_type: "SALE",
            quantity: component.quantity_used,
            unit_price: component.unit_cost,
            total_price: component.total_cost,
            created_by: userId,
          });
        }

        // CONTAINER
        if (item.sales_container) {
          await SaleItemContainerModel.createContainer(client, {
            sale_item_id: saleItem.id,
            container_id: item.sales_container.container_id,
            container_name_snapshot:
              item.sales_container.container_name_snapshot,

            quantity_used: item.sales_container.quantity_used,

            unit_cost: item.sales_container.unit_cost,

            unit_price: item.sales_container.unit_price,

            total_cost: item.sales_container.total_cost,

            total_price: item.sales_container.total_price,
          });

          // DISCOUNT CONTAINER STOCK
          await StockContainerModel.discountStock(client, {
            container_id: item.sales_container.container_id,

            location_id: data.location_id,

            quantity: item.sales_container.quantity_used,
          });
        }
      }

      await client.query("COMMIT");

      return sale;
    } catch (error) {
      console.log(error);
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
