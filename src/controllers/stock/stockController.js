import { validateSchema } from '../../helpers/validateSchema.js'
import { StockModel } from '../../models/stock/stockModel.js'
import { StockMovementModel } from '../../models/stock/stockMovementModel.js'
import { BussinesLogicStock } from '../../services/stock/bussinesLogicStock.js'
import { StockService } from '../../services/stock/stockServices.js'
import { handleError } from '../../helpers/handleError.js'
import {
  createStockSchema,
  deleteStockSchema,
  retrieveStockSchema,
  registerLossStockSchema,
  registerAdjustmentStockSchema,
  updateStockSchema,
  ListStockSchema,
  ListStockMovementSchema
} from '../../shemas/stock/stockSchemas.js'

export class StockController {
  static async createStock (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(createStockSchema, req.body)

      if (error) {
        return res.status(400).json({ error })
      }

      // Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price
      })

      const result = await StockService.createStock({
        userId,
        params: data,
        unitsPrice
      })

      if (!result) {
        return res.status(404).json({ error: 'Error with creation' })
      }
      return res.status(201).json({
        message: 'CREATE SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async deleteStock (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(deleteStockSchema, req.query)
      if (error) {
        return res.status(400).json({ error })
      }

      const result = await StockModel.deleteStock({
        userId,
        data: { ...data, id: req.location.id }
      })
      if (!result) {
        return res.status(404).json({ error: 'Stock not found' })
      }
      return res.status(200).json({
        message: 'DELETE SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async updateStock (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(updateStockSchema, req.body)
      if (error) {
        return res.status(400).json({ error })
      }

      // Unit conversion is pure; the weighted-average price is computed inside
      // the service transaction from a row-locked read (no lost updates).
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price
      })

      const result = await StockService.updateStock({
        stockId: data.stock_id,
        userId,
        location_id: data.location_id,
        component_id: data.component_id,
        unitsPrice
      })

      if (!result) {
        return res.status(404).json({ error: 'Error with update' })
      }
      return res.status(200).json({
        message: 'UPDATE SUCCESSFULLY',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async registerLoss (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(registerLossStockSchema, req.body)
      if (error) {
        return res.status(400).json({ error })
      }

      // Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price
      })

      const result = await StockService.registerLoss({
        stockId: data.stock_id,
        location_id: data.location_id,
        component_id: data.component_id,
        userId,
        unitsPrice,
        data
      })
      if (!result) {
        return res.status(404).json({ error: 'Error with Update' })
      }

      return res.status(200).json({
        message: 'REGISTER LOSS SUCCESSFULLY',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async registerAdjustment (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(registerAdjustmentStockSchema, req.body)
      if (error) {
        return res.status(400).json({ error })
      }

      // Logic for Unit value
      const unitsPrice = await BussinesLogicStock.convertMeasuresStock({
        purchase_price: data.total_purchase_price,
        quantity_base: data.quantity_base,
        unit: data.unit,
        userId,
        wholesale_price: data.wholesale_price,
        consumer_price: data.consumer_price
      })

      const result = await StockService.registerAdjust({
        stockId: data.stock_id,
        location_id: data.location_id,
        component_id: data.component_id,
        userId,
        unitsPrice,
        data
      })
      if (!result) {
        return res.status(404).json({ error: 'Error with Update' })
      }

      return res.status(200).json({
        message: 'REGISTER ADJUST SUCCESSFULLY',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async retrieveStock (req, res) {
    try {
      const { data, error } = validateSchema(retrieveStockSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await StockModel.retrieveStock({
        stock_id: data.id_stock,
        location_id: req.location.id
      })
      if (!result) {
        return res.status(404).json({ error: 'Error not found' })
      }

      return res.status(200).json({
        message: 'RETRIEVE SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async listStock (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(ListStockSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await StockModel.listStock({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        location: data.id,
        type_component: data.type_component
      })
      if (!result) {
        return res.status(404).json({ error: 'not fount Stock' })
      }
      return res.status(200).json({
        message: 'LIST SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async listMovements (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(ListStockMovementSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await StockMovementModel.listMovements({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        location: data.id,
        movement_type: data.movement_type,
        component_id: data.component_id
      })

      if (!result) {
        return res.status(404).json({ error: 'not fount Movements' })
      }
      return res.status(200).json({
        message: 'LIST SUCCESSFULLY',
        result
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }
}
