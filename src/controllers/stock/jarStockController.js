import { validateSchema } from '../../helpers/validateSchema.js'
import { ComponentJarStockModel } from '../../models/stock/componentJarStockModel.js'
import { JarMovementModel } from '../../models/stock/jarMovementModel.js'
import { JarStockService } from '../../services/stock/jarStockServices.js'
import { handleError } from '../../helpers/handleError.js'
import {
  transferToJarSchema,
  retrieveJarStockSchema,
  ListJarStockSchema,
  ListJarMovementSchema
} from '../../shemas/stock/jarStockSchemas.js'

export class JarStockController {
  static async transferToJar (req, res) {
    try {
      const { id: userId } = req.user
      const { data, error } = validateSchema(transferToJarSchema, req.body)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await JarStockService.transferToJar({ userId, data })

      return res.status(200).json({
        message: 'TRANSFER SUCCESSFULLY',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async retrieveJarStock (req, res) {
    try {
      const { data, error } = validateSchema(retrieveJarStockSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await ComponentJarStockModel.retrieveByComponent({
        component_id: data.component_id,
        location_id: req.location.id
      })

      if (!result) {
        return res.status(404).json({ error: 'Jar stock not found' })
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

  static async listJarStock (req, res) {
    try {
      const { id: brandId } = req.brand
      const { data, error } = validateSchema(ListJarStockSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await ComponentJarStockModel.listJarStock({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        name: data.name,
        location: data.id
      })

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
      const { data, error } = validateSchema(ListJarMovementSchema, req.query)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await JarMovementModel.listMovements({
        brand_id: brandId,
        page: data.page,
        limit: data.limit,
        location: data.id,
        movement_type: data.movement_type,
        component_id: data.component_id
      })

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
