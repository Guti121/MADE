import { Router } from "express";
import { formulaController } from "../../controllers/formula/formulaController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateBrandAccess } from "../../middleware/accessMiddleware.js";
import { FormulaComponentsController } from "../../controllers/formula/formulaComponentsController.js";

export const formulaRouter = Router();

formulaRouter.post(
  "/create",
  authMiddleware,
  validateBrandAccess,
  formulaController.createFormula,
);

formulaRouter.delete(
  "/delete",
  authMiddleware,
  validateBrandAccess,
  formulaController.deleteFormula,
);

formulaRouter.get(
  "/list",
  authMiddleware,
  validateBrandAccess,
  formulaController.listFormula,
);

//formula components

formulaRouter.get(
  "/retrieve-components",
  authMiddleware,
  validateBrandAccess,
  FormulaComponentsController.retrieveComponents,
);
