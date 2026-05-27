import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { validateBrandAccess } from "../../middleware/accessMiddleware.js";
import { ContainerController } from "../../controllers/containers/containerController.js";
import { TypeContainerController } from "../../controllers/containers/typeContainersController.js";

export const containerRouter = Router();

//type Containers
containerRouter.post(
  "/create-type",
  authMiddleware,
  validateBrandAccess,
  TypeContainerController.createTypeContainer,
);
containerRouter.delete(
  "/delete-type",
  authMiddleware,
  validateBrandAccess,
  TypeContainerController.deleteTypeContainer,
);

//Containers
containerRouter.post(
  "/create",
  authMiddleware,
  validateBrandAccess,
  ContainerController.createContainer,
);
