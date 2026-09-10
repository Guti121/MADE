import { Router } from 'express'
import { formulaController } from '../../controllers/formula/formulaController.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import {
  validateBrandAccess,
  validateLocationAccess
} from '../../middleware/accessMiddleware.js'
import { requireRole } from '../../middleware/roleMiddleware.js'
import { FormulaComponentsController } from '../../controllers/formula/formulaComponentsController.js'

export const formulaRouter = Router()

const owner = requireRole('owner', 'admin')

// preview is read-only (no writes) — no role gate.
formulaRouter.post(
  '/preview',
  authMiddleware,
  validateBrandAccess,
  formulaController.previewFormula
)

formulaRouter.post(
  '/create',
  authMiddleware,
  owner,
  validateBrandAccess,
  formulaController.createFormula
)

formulaRouter.delete(
  '/delete',
  authMiddleware,
  owner,
  validateBrandAccess,
  formulaController.deleteFormula
)

formulaRouter.get(
  '/list',
  authMiddleware,
  validateBrandAccess,
  formulaController.listFormula
)
formulaRouter.get(
  '/list-by-location',
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  formulaController.listFormuByLocation
)

formulaRouter.get(
  '/retrieve-components',
  authMiddleware,
  validateBrandAccess,
  FormulaComponentsController.retrieveComponents
)
