import { Router } from "express";
import { TypeComponentsController } from "../../controllers/components/typeComponentsContoller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateBrandAccess } from "../../middleware/accessMiddleware.js";
import { ComponentController } from "../../controllers/components/componentsController.js";

export const componentRouter = Router();

// typeComponents Routes
// type_components is a global, seed-managed catalog: listing only, no brand scope.
componentRouter.get(
  "/list-type",
  authMiddleware,
  TypeComponentsController.ListTypeComponent,
);

//ComponentRoutes--------------------------------------------------------
componentRouter.post(
  "/create",
  authMiddleware,
  validateBrandAccess,
  ComponentController.createComponent,
);
componentRouter.get(
  "/delete/:id",
  authMiddleware,
  validateBrandAccess,
  ComponentController.deleteComponent,
);
componentRouter.post(
  "/update",
  authMiddleware,
  validateBrandAccess,
  ComponentController.updateComponent,
);
componentRouter.get(
  "/list",
  authMiddleware,
  validateBrandAccess,
  ComponentController.listComponent,
);
