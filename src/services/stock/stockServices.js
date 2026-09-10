import { pool } from '../../config/db.js'
import { StockModel } from '../../models/stock/stockModel.js'
import { StockMovementModel } from '../../models/stock/stockMovementModel.js'
import { BussinesLogicStock } from './bussinesLogicStock.js'
import { AppError } from '../../helpers/AppError.js'

// CREATE INITIAL MOVEMENT
// | movement_type |
// | ------------- |
// | INITIAL_STOCK |
// | PURCHASE      |
// | SALE          |
// | ADJUSTMENT  +  |
// | ADJUSTMENT  -  |
// | LOSS          |d
// | RETURN        |

// services for stock , creation , adjustment , loss stock ...
export class StockService {
  static async createStock ({ userId, params, unitsPrice }) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // 1. CREATE STOCK
      const stock = await StockModel.createStock(client, {
        userId,
        params,
        unitsPrice
      })

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

        movement_type: 'INITIAL_STOCK',

        quantity: stock.quantity_base,

        unit_price: stock.avg_price,

        total_price: stock.quantity_base * stock.avg_price,

        created_by: userId
      })

      await client.query('COMMIT')

      return stock
    } catch (error) {
      await client.query('ROLLBACK')

      throw error
    } finally {
      client.release()
    }
  }

  static async updateStock ({
    stockId,
    userId,
    location_id,
    component_id,
    unitsPrice
  }) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Lock the row, then compute the weighted-average price from the LOCKED
      // state — never from an unlocked read that a concurrent purchase can
      // invalidate (lost update).
      const current = await StockModel.lockStock(client, {
        stockId,
        location_id,
        component_id
      })
      if (!current) {
        throw new AppError('Stock not found')
      }

      const AVGPrice = await BussinesLogicStock.calculeteAVGPrice({
        stock: current,
        data: unitsPrice
      })

      const stock = await StockModel.updateStock(client, {
        stockId,
        unitsPrice,
        location_id,
        component_id,
        AVGPrice,
        userId
      })

      await StockMovementModel.createMovement(client, {
        stock_id: stock.id,

        movement_type: 'PURCHASE',
        location_id,

        quantity: unitsPrice.quantityInBase,

        unit_price: unitsPrice.purchaseUnitPrice,

        total_price: unitsPrice.quantityInBase * unitsPrice.purchaseUnitPrice,

        created_by: userId
      })

      await client.query('COMMIT')

      return stock
    } catch (error) {
      await client.query('ROLLBACK')

      throw error
    } finally {
      client.release()
    }
  }

  static async registerLoss ({ stockId, location_id, component_id, userId, unitsPrice, data }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const current = await StockModel.lockStock(client, {
        stockId,
        location_id,
        component_id
      })
      if (!current) {
        throw new AppError('Stock not found')
      }

      // Recompute the new balance from the LOCKED row (throws if insufficient).
      const newQuantity = await BussinesLogicStock.registerLoss({
        stock: current,
        unitsPrice
      })

      const result = await StockModel.registerLoss(client, {
        quantity: newQuantity,
        userId,
        stockId: current.id,
        component_id: current.component_id,
        location_id: current.location_id
      })
      if (!result) {
        throw new AppError('Error updating stock')
      }
      await StockMovementModel.createMovement(client, {
        stock_id: current.id,
        component_id: current.component_id,
        location_id: current.location_id,
        movement_type: 'LOSS',
        quantity: Number(result.quantity_base) - Number(current.quantity_base),
        unit_price: current.avg_price,
        total_price: Number(current.avg_price) * Number(result.quantity_base),
        reason: data.reason,
        created_by: userId
      })
      await client.query('COMMIT')

      return result
    } catch (error) {
      await client.query('ROLLBACK')

      throw error
    } finally {
      client.release()
    }
  }

  static async registerAdjust ({ stockId, location_id, component_id, userId, unitsPrice, data }) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const current = await StockModel.lockStock(client, {
        stockId,
        location_id,
        component_id
      })
      if (!current) {
        throw new AppError('Stock not found')
      }

      const newQuantity = await BussinesLogicStock.registerAdjustment({
        stock: current,
        unitsPrice
      })

      const result = await StockModel.registerAdjust(client, {
        quantity: newQuantity,
        userId,
        stockId: current.id,
        component_id: current.component_id,
        location_id: current.location_id
      })
      if (!result) {
        throw new AppError('Error updating stock')
      }
      await StockMovementModel.createMovement(client, {
        stock_id: current.id,
        component_id: current.component_id,
        location_id: current.location_id,
        movement_type: 'ADJUSTMENT',
        quantity: Number(result.quantity_base) - Number(current.quantity_base),
        unit_price: current.avg_price,
        total_price: Number(current.avg_price) * Number(result.quantity_base),
        reason: data.reason,
        created_by: userId
      })
      await client.query('COMMIT')

      return result
    } catch (error) {
      await client.query('ROLLBACK')

      throw error
    } finally {
      client.release()
    }
  }
}
