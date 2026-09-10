import { Router } from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import {
  validateBrandAccess,
  validateComponentAccess,
  validateLocationAccess
} from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { JarStockController } from '../../controllers/stock/jarStockController.js'

export const jarStockRouter = Router()

jarStockRouter.post(
  '/transfer',
  authMiddleware,
  requireRole('owner', 'admin'),
  validateLocationAccess,
  validateComponentAccess,
  JarStockController.transferToJar
)

jarStockRouter.get(
  '/retrieve',
  authMiddleware,
  validateLocationAccess,
  JarStockController.retrieveJarStock
)

jarStockRouter.get(
  '/list',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  JarStockController.listJarStock
)

jarStockRouter.get(
  '/movements/list',
  authMiddleware,
  validateBrandAccess,
  JarStockController.listMovements
)
