import { Router } from 'express'
import { BrandController } from '../controllers/brandController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'

export const brandRoutes = Router()

brandRoutes.post(
  '/create-brand',
  authMiddleware,
  requireRole('owner', 'admin'),
  BrandController.createBrand
)
brandRoutes.delete(
  '/delete-brand',
  authMiddleware,
  requireRole('owner', 'admin'),
  BrandController.deleteBrand
)
brandRoutes.put(
  '/update-brand',
  authMiddleware,
  requireRole('owner', 'admin'),
  BrandController.updateBrand
)
brandRoutes.get('/view-brand', authMiddleware, BrandController.viewBrand)
