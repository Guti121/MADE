import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import {
  validateBrandAccess,
  validateLocationAccess
} from '../../middleware/accessMiddleware.js'
import { SaleController } from '../../controllers/sales/salesController.js'

export const saleRouter = Router()

saleRouter.post(
  '/preview',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  SaleController.previewSale
)

saleRouter.post(
  '/create-sale',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  SaleController.createSale
)

saleRouter.get(
  '/list-sale',
  authMiddleware,
  validateLocationAccess,
  SaleController.listSales
)
saleRouter.get(
  '/retrieve-sale',
  authMiddleware,
  validateLocationAccess,
  SaleController.retrieveSale
)
