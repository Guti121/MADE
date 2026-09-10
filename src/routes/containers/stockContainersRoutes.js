import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import {
  validateBrandAccess,
  validateContainerAccess,
  validateLocationAccess
} from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { StockContainerController } from '../../controllers/containers/stockContainerController.js'

export const stockContainerRouter = Router()

const owner = requireRole('owner', 'admin')

stockContainerRouter.post(
  '/create',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateContainerAccess,
  StockContainerController.createStockContainer
)

stockContainerRouter.delete(
  '/delete',
  authMiddleware,
  owner,
  validateLocationAccess,
  StockContainerController.deleteStockContainer
)

stockContainerRouter.post(
  '/update',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateContainerAccess,
  StockContainerController.updateStockContainer
)

stockContainerRouter.post(
  '/register-loss',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateContainerAccess,
  StockContainerController.registerLossContainer
)

stockContainerRouter.post(
  '/register-adjustment',
  authMiddleware,
  owner,
  validateLocationAccess,
  validateContainerAccess,
  StockContainerController.registerAdjustmentContainer
)

stockContainerRouter.get(
  '/list',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  StockContainerController.listStock
)
stockContainerRouter.get(
  '/retrieve',
  authMiddleware,
  validateLocationAccess,
  StockContainerController.retrieveStockContainer
)

stockContainerRouter.get(
  '/movements/list',
  authMiddleware,
  validateBrandAccess,
  StockContainerController.listMovements
)
