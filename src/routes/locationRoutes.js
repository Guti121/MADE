import { Router } from 'express'
import { locationController } from '../controllers/locationController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'
import { requireRole } from '../middleware/roleMiddleware.js'

export const locationRoutes = Router()

locationRoutes.post(
  '/create-location',
  authMiddleware,
  requireRole('owner', 'admin'),
  locationController.createLocation
)
locationRoutes.delete(
  '/delete-location',
  authMiddleware,
  requireRole('owner', 'admin'),
  locationController.deleteLocation
)
locationRoutes.put(
  '/update-location',
  authMiddleware,
  requireRole('owner', 'admin'),
  locationController.updateLocation
)

locationRoutes.get(
  '/list-location',
  authMiddleware,
  locationController.viewLocation
)

locationRoutes.get(
  '/retrieve-location',
  authMiddleware,
  locationController.retrieveLocation
)
