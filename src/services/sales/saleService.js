import { FormulaModel } from '../../models/formula/formulaModel.js'
import { FormulaComponentsModel } from '../../models/formula/FormulaComponentsModel.js'
import { AccessService } from '../AccessService.js'
import { SaleModel } from '../../models/sales/saleModel.js'
import { AppError } from '../../helpers/AppError.js'
import { LogicBussinesSale } from './logicBussinesSale.js'
import { SaleTransactionService } from './saleTransactionService.js'

export class SaleService {
  // Resolve, per item, the formula + its lines + the chosen essence.
  static async buildItemsContext ({ userId, brandId, data }) {
    const itemsContext = new Map()

    for (const item of data.sales_items) {
      const formula = await FormulaModel.retrieveModel({
        id: item.formula_id,
        brandId
      })

      if (!formula) {
        throw new AppError(`Formula ${item.formula_id} not found`, 404)
      }

      const formulaLines = await FormulaComponentsModel.listByFormula(
        formula.id
      )

      const essence = await AccessService.validateEssenceComponent({
        componentId: item.essence_component_id,
        userId
      })

      if (!essence) {
        throw new AppError('Esencia inválida', 400)
      }

      itemsContext.set(item, { formula, formulaLines, essence })
    }

    return itemsContext
  }

  // Price a sale without persisting it. Same computation as createSale.
  static async previewSale ({ userId, data, brandId }) {
    const itemsContext = await this.buildItemsContext({ userId, brandId, data })
    return LogicBussinesSale.processSale({ data, itemsContext })
  }

  static async createSale ({ userId, data, brandId }) {
    const itemsContext = await this.buildItemsContext({ userId, brandId, data })

    const calculatedSale = await LogicBussinesSale.processSale({
      data,
      itemsContext
    })

    const sale = await SaleTransactionService.createSale({
      userId,
      data: calculatedSale
    })

    return sale
  }

  static validateDateRange ({ start_date, end_date }) {
    // No dates = no date filter
    if (!start_date && !end_date) {
      return
    }

    if (!start_date || !end_date) {
      throw new AppError('start_date and end_date must be provided together', 400)
    }

    const start = new Date(`${start_date}T00:00:00`)
    const end = new Date(`${end_date}T23:59:59`)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date range', 400)
    }

    if (start > end) {
      throw new AppError('start_date cannot be greater than end_date', 400)
    }

    // Must be the same month and year
    if (
      start.getFullYear() !== end.getFullYear() ||
      start.getMonth() !== end.getMonth()
    ) {
      throw new AppError('The date range cannot exceed one month', 400)
    }
  }

  static calculateSummary (sales) {
    const summary = {
      sales_count: sales.length,
      total_sales: 0,
      total_cost: 0,
      total_profit: 0,
      average_ticket: 0
    }

    for (const sale of sales) {
      summary.total_sales += Number(sale.subtotal)
      summary.total_cost += Number(sale.total_cost)
      summary.total_profit += Number(sale.total_profit)
    }

    if (summary.sales_count > 0) {
      summary.average_ticket = summary.total_sales / summary.sales_count
    }

    return summary
  }

  static async listSales ({
    location_id,
    page,
    limit,
    client_id,
    payment_method,
    start_date,
    end_date
  }) {
    // Validate date range
    this.validateDateRange({
      start_date,
      end_date
    })

    // Get paginated sales
    const sales = await SaleModel.listSales({
      location_id,
      page,
      limit,
      client_id,
      payment_method,
      start_date,
      end_date
    })

    let summary

    // If dates were provided,
    // calculate statistics for the entire period.
    if (start_date && end_date) {
      summary = await SaleModel.getSalesStatistics({
        location_id,
        start_date,
        end_date
      })
    } else {
      // No date filter:
      // calculate only the current page.
      summary = this.calculateSummary(sales.data)
    }

    return {
      summary,
      sales
    }
  }
}
