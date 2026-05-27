import { Router } from "express";
import { TypeComponentsController } from "../../controllers/components/typeComponentsContoller.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateBrandAccess } from "../../middleware/accessMiddleware.js";
import { ComponentController } from "../../controllers/components/componentsController.js";

export const componentRouter = Router();

//typeComponents Routes
componentRouter.post(
  "/create-type",
  authMiddleware,
  validateBrandAccess,
  TypeComponentsController.createTypeComponent,
);

componentRouter.delete(
  "/delete-type/:idType",
  authMiddleware,
  validateBrandAccess,
  TypeComponentsController.deleteTypeComponent,
);

componentRouter.get(
  "/list-type",
  authMiddleware,
  validateBrandAccess,
  TypeComponentsController.ListTypeComponent,
);

componentRouter.post(
  "/update-type",
  authMiddleware,
  validateBrandAccess,
  TypeComponentsController.updateTypeComponent,
);

//ComponentRoutes--------------------------------------------------------
componentRouter.post(
  "/create",
  authMiddleware,
  validateBrandAccess,
  ComponentController.createComponent,
);
componentRouter.delete(
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
