import { validateSchema } from '../../helpers/validateSchema.js'
import { SaleModel } from '../../models/sales/saleModel.js'
import { SaleService } from '../../services/sales/saleService.js'
import { handleError } from '../../helpers/handleError.js'
import {
  createSaleSchema,
  getSaleSchema,
  retrieveSaleSchema
} from '../../shemas/sales/salesSchemas.js'

export class SaleController {
  static async previewSale (req, res) {
    try {
      const { id: userId } = req.user
      const { id: brandId } = req.brand

      const { data, error } = validateSchema(createSaleSchema, req.body)

      if (error) {
        return res.status(400).json({ error })
      }

      const result = await SaleService.previewSale({ userId, brandId, data })

      return res.status(200).json({
        message: 'SALE PREVIEW',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async createSale (req, res) {
    try {
      const { id: userId } = req.user
      const { id: brandId } = req.brand

      const { data, error } = validateSchema(createSaleSchema, req.body)

      if (error) {
        return res.status(400).json({
          error
        })
      }

      const result = await SaleService.createSale({
        userId,
        brandId,
        data
      })

      if (!result) {
        return res.status(400).json({
          error: 'Error creating sale'
        })
      }

      return res.status(201).json({
        message: 'SALE CREATED SUCCESSFULLY',
        result
      })
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async listSales (req, res) {
    try {
      const { data, error } = validateSchema(getSaleSchema, req.query)

      if (error) {
        return res.status(400).json({
          error
        })
      }

      const result = await SaleService.listSales({
        // Use the location id verified by validateLocationAccess, never the
        // raw query value, so middleware and model can never disagree.
        location_id: req.location.id,
        page: data.page,
        limit: data.limit,
        client_id: data.client_id,
        payment_method: data.payment_method,
        start_date: data.start_date,
        end_date: data.end_date
      })
      return res.status(200).json(result)
    } catch (error) {
      return handleError(res, error)
    }
  }

  static async retrieveSale (req, res) {
    try {
      const { data, error } = validateSchema(retrieveSaleSchema, req.query)
      if (error) {
        return res.status(400).json({
          error
        })
      }
      const result = await SaleModel.retrieveSaleDetail({
        id: data.id_sale,
        location_id: req.location.id
      })

      return res.status(200).json(result)
    } catch (error) {
      return handleError(res, error)
    }
  }
}
