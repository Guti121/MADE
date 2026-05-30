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
containerRouter.get(
  "/list-type",
  authMiddleware,
  validateBrandAccess,
  TypeContainerController.ListTypeContainer,
);

containerRouter.post(
  "/update-type",
  authMiddleware,
  validateBrandAccess,
  TypeContainerController.updateTypeContainer,
);

//Containers
containerRouter.post(
  "/create",
  authMiddleware,
  validateBrandAccess,
  ContainerController.createContainer,
);
containerRouter.post(
  "/update",
  authMiddleware,
  validateBrandAccess,
  ContainerController.updateContainer,
);
containerRouter.delete(
  "/delete",
  authMiddleware,
  validateBrandAccess,
  ContainerController.deleteContainer,
);
containerRouter.get(
  "/list",
  authMiddleware,
  validateBrandAccess,
  ContainerController.listContainer,
);
