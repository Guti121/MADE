import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import {
  validateBrandAccess,
  validateComponentAccess,
  validateLocationAccess
} from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { StockController } from '../../controllers/stock/stockController.js'

export const stockRouter = Router()

const owner = requireRole('owner', 'admin')

stockRouter.post(
  '/create',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateComponentAccess,
  StockController.createStock
)

stockRouter.delete(
  '/delete',
  authMiddleware,
  owner,
  validateLocationAccess,
  StockController.deleteStock
)

stockRouter.post(
  '/update',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateComponentAccess,
  StockController.updateStock
)

stockRouter.post(
  '/register-loss',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateComponentAccess,
  StockController.registerLoss
)

stockRouter.post(
  '/register-adjustment',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateComponentAccess,
  StockController.registerAdjustment
)

stockRouter.get(
  '/list',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  StockController.listStock
)
stockRouter.get(
  '/retrieve',
  authMiddleware,
  validateLocationAccess,
  StockController.retrieveStock
)

stockRouter.get(
  '/movements/list',
  authMiddleware,
  validateBrandAccess,
  StockController.listMovements
)
