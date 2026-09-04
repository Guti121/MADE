import { SaleItemModel } from "../../models/sales/saleItemModel.js";
import { SaleItemComponentModel } from "../../models/sales/saleItemComponentModel.js";
import { SaleItemContainerModel } from "../../models/sales/saleItemContainerModel.js";

import { StockContainerModel } from "../../models/containers/stockContainerModel.js";

import { StockContainerMovementModel } from "../../models/containers/stockContainerMovement.js";
import { ComponentJarStockModel } from "../../models/stock/componentJarStockModel.js";
import { JarMovementModel } from "../../models/stock/jarMovementModel.js";
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
          formula_unit_price: item.formula_unit_price,
          formula_base_price: item.formula_base_price,
        });

        // COMPONENTS (includes the chosen essence, is_essence = true)
        for (const component of item.sales_components) {
          await SaleItemComponentModel.createComponent(client, {
            sale_item_id: saleItem.id,
            component_id: component.component_id,
            component_name_snapshot: component.component_name_snapshot,
            is_essence: component.is_essence,
            quantity_used: component.quantity_used,
            unit_cost: component.unit_cost,
            unit_price: component.unit_price,
            total_cost: component.total_cost,
            total_price: component.total_price,
          });

          // DISCOUNT JAR STOCK (a sale draws from the jar, not bodega)
          const discountJar = await ComponentJarStockModel.discountStock(
            client,
            {
              component_id: component.component_id,
              location_id: data.location_id,
              quantity: component.quantity_used,
            },
          );

          // JAR MOVEMENT
          await JarMovementModel.createMovement(client, {
            jar_stock_id: discountJar.id,
            location_id: discountJar.location_id,
            movement_type: "SALE",
            quantity: component.quantity_used,
            unit_price: component.unit_cost,
            total_price: component.total_cost,
            reference_id: sale.id,
            reference_type: "SALE",
            created_by: userId,
          });
        }

        // CONTAINER (optional, one per item)
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
          const discountContainer = await StockContainerModel.discountStock(
            client,
            {
              container_id: item.sales_container.container_id,
              location_id: data.location_id,
              quantity: item.sales_container.quantity_used,
            },
          );

          // CONTAINER MOVEMENT
          await StockContainerMovementModel.createMovement(client, {
            stock_id: discountContainer.id,
            container_id: discountContainer.container_id,
            location_id: discountContainer.location_id,
            movement_type: "SALE",
            quantity: item.sales_container.quantity_used,
            unit_price: item.sales_container.unit_cost,
            total_price: item.sales_container.total_cost,
            reference_id: sale.id,
            reference_type: "SALE",
            created_by: userId,
          });
        }
      }

      await client.query("COMMIT");

      return sale;
    } catch (error) {
      await client.query("ROLLBACK");

      throw error;
    } finally {
      client.release();
    }
  }
}
