import { StockModel } from "../../models/stock/stockModel.js";
import { StockContainerModel } from "../../models/containers/stockContainerModel.js";

export class LogicBussinesSale {
  static calculatePrices({
    quantity,
    avgPrice,
    wholesalePrice,
    consumerPrice,
    isWholesale,
  }) {
    const unitCost = Number(avgPrice);

    const unitPrice = isWholesale
      ? Number(wholesalePrice)
      : Number(consumerPrice);

    return {
      unitCost,
      unitPrice,
      totalCost: quantity * unitCost,
      totalPrice: quantity * unitPrice,
    };
  }

  static groupComponents({ data }) {
    const componentsMap = new Map();

    for (const sale of data.sales_items) {
      for (const component of sale.sales_components) {
        const current = componentsMap.get(component.component_id) || 0;

        componentsMap.set(
          component.component_id,
          current + Number(component.quantity_used),
        );
      }
    }

    return componentsMap;
  }
  static async validateStock({ data }) {
    const groupedComponents = this.groupComponents({ data });

    for (const [componentId, quantityNeeded] of groupedComponents) {
      const stock = await StockModel.retrieveStockByComponent({
        component_id: componentId,
        location_id: data.location_id,
      });
      console.log({ component_id: componentId, location_id: data.location_id });
      if (!stock) {
        throw new Error(`Stock not found for component ${componentId}`);
      }

      if (quantityNeeded > Number(stock.quantity_base)) {
        throw new Error(`Insufficient stock for component ${componentId}`);
      }
    }
  }
  static async pricesComponents({ data }) {
    let saleTotalCost = 0;
    let saleTotalPrice = 0;

    for (const sale of data.sales_items) {
      let itemTotalCost = 0;
      let itemTotalPrice = 0;
      let itemQuantity = 0;

      console.log(sale);

      if (!sale.sales_components?.length) {
        throw new Error("This sale doesn't have components");
      }

      for (const component of sale.sales_components) {
        const stock = await StockModel.retrieveStockByComponent({
          component_id: component.component_id,
          location_id: data.location_id,
        });
        console.log("1");
        if (!stock) {
          throw new Error(
            `Stock not found for component ${component.component_id}`,
          );
        }

        console.log("2");

        const prices = this.calculatePrices({
          quantity: Number(component.quantity_used),
          avgPrice: stock.avg_price,
          wholesalePrice: stock.wholesale_price,
          consumerPrice: stock.consumer_price,
          isWholesale: data.is_wholesale,
        });

        component.unit_cost = prices.unitCost;
        component.unit_price = prices.unitPrice;
        component.total_cost = prices.totalCost;
        component.total_price = prices.totalPrice;

        itemTotalCost += prices.totalCost;
        itemTotalPrice += prices.totalPrice;
        itemQuantity += component.quantity_used;
      }
      console.log("3");
      if (sale.sales_container) {
        const containerStock = await StockContainerModel.retrieveByContainer({
          container_id: sale.sales_container.container_id,
          location_id: data.location_id,
        });

        if (!containerStock) {
          throw new Error(
            `Container stock not found for container ${sale.sales_container.container_id}`,
          );
        }

        const prices = this.calculatePrices({
          quantity: Number(sale.sales_container.quantity_used),
          avgPrice: containerStock.avg_price,
          wholesalePrice: containerStock.wholesale_price,
          consumerPrice: containerStock.consumer_price,
          isWholesale: data.is_wholesale,
        });

        sale.sales_container.unit_cost = prices.unitCost;
        sale.sales_container.unit_price = prices.unitPrice;
        sale.sales_container.total_cost = prices.totalCost;
        sale.sales_container.total_price = prices.totalPrice;

        itemTotalCost += prices.totalCost;
        itemTotalPrice += prices.totalPrice;
      }
      console.log("holaa");
      sale.total_cost = itemTotalCost;
      sale.subtotal = itemTotalPrice;
      sale.quantity += itemQuantity;
      saleTotalCost += itemTotalCost;
      saleTotalPrice += itemTotalPrice;
    }
    data.total_cost = saleTotalCost;
    data.subtotal = saleTotalPrice;
    data.total_profit = saleTotalPrice - saleTotalCost;

    return data;
  }
}
