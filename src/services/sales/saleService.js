import { FormulaModel } from "../../models/formula/formulaModel.js";
import { SaleModel } from "../../models/sales/saleModel.js";
import { LogicBussinesSale } from "./logicBussinesSale.js";
import { SaleTransactionService } from "./saleTransactionService.js";

export class SaleService {
  static async createSale({ userId, data, brandId }) {
    for (const item of data.sales_items) {
      const formula = await FormulaModel.retrieveModel({
        id: item.formula_id,
        brandId,
      });

      if (!formula) {
        throw new Error(`Formula ${item.formula_id} not found`);
      }
    }
    await LogicBussinesSale.validateStock({
      data,
    });

    const calculatedSale = await LogicBussinesSale.pricesComponents({
      data,
    });

    // 4. Create transaction
    const result = await SaleTransactionService.createSale({
      userId,
      data: calculatedSale,
    });
    console.log(calculatedSale);

    return calculatedSale;
  }
  static validateDateRange({ start_date, end_date }) {
    // No dates = no date filter
    if (!start_date && !end_date) {
      return;
    }

    // One date without the other
    if (!start_date || !end_date) {
      const error = new Error(
        "start_date and end_date must be provided together",
      );

      error.status = 400;

      throw error;
    }

    const start = new Date(`${start_date}T00:00:00`);
    const end = new Date(`${end_date}T23:59:59`);

    // Invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error = new Error("Invalid date range");

      error.status = 400;

      throw error;
    }

    // Start cannot be after end
    if (start > end) {
      const error = new Error("start_date cannot be greater than end_date");

      error.status = 400;

      throw error;
    }

    // Must be the same month and year
    if (
      start.getFullYear() !== end.getFullYear() ||
      start.getMonth() !== end.getMonth()
    ) {
      const error = new Error("The date range cannot exceed one month");

      error.status = 400;

      throw error;
    }
  }

  static calculateSummary(sales) {
    const summary = {
      sales_count: sales.length,
      total_sales: 0,
      total_cost: 0,
      total_profit: 0,
      average_ticket: 0,
    };

    for (const sale of sales) {
      summary.total_sales += Number(sale.subtotal);
      summary.total_cost += Number(sale.total_cost);
      summary.total_profit += Number(sale.total_profit);
    }

    if (summary.sales_count > 0) {
      summary.average_ticket = summary.total_sales / summary.sales_count;
    }

    return summary;
  }

  static async listSales({
    location_id,
    page,
    limit,
    client_id,
    start_date,
    end_date,
  }) {
    // Validate date range
    this.validateDateRange({
      start_date,
      end_date,
    });

    // Get paginated sales
    const sales = await SaleModel.listSales({
      location_id,
      page,
      limit,
      client_id,
      start_date,
      end_date,
    });

    let summary;

    // If dates were provided,
    // calculate statistics for the entire period.
    if (start_date && end_date) {
      summary = await SaleModel.getSalesStatistics({
        location_id,
        start_date,
        end_date,
      });
    } else {
      // No date filter:
      // calculate only the current page.
      summary = this.calculateSummary(sales.data);
    }

    return {
      summary,
      sales,
    };
  }
}
