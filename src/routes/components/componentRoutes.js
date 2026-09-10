import { Router } from 'express'
import { TypeComponentsController } from '../../controllers/components/typeComponentsContoller.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { validateBrandAccess } from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { ComponentController } from '../../controllers/components/componentsController.js'

export const componentRouter = Router()

// type_components is a global, seed-managed catalog: listing only, no brand scope.
componentRouter.get(
  '/list-type',
  authMiddleware,
  TypeComponentsController.ListTypeComponent
)

componentRouter.post(
  '/create',
  authMiddleware,
  requireRole('owner', 'admin'),
  validateBrandAccess,
  ComponentController.createComponent
)
// NOTE: still GET for frontend compatibility (state change via GET — L1).
// CSRF is contained by sameSite:strict cookies + the CORS allowlist.
componentRouter.get(
  '/delete/:id',
  authMiddleware,
  requireRole('owner', 'admin'),
  validateBrandAccess,
  ComponentController.deleteComponent
)
componentRouter.post(
  '/update',
  authMiddleware,
  requireRole('owner', 'admin'),
  validateBrandAccess,
  ComponentController.updateComponent
)
componentRouter.get(
  '/list',
  authMiddleware,
  validateBrandAccess,
  ComponentController.listComponent
)
