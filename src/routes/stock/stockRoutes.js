import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  validateBrandAccess,
  validateComponentAccess,
  validateLocationAccess,
} from "../../middleware/accessMiddleware.js";
import { StockController } from "../../controllers/stock/stockController.js";

export const stockRouter = Router();

stockRouter.post(
  "/create",
  authMiddleware,
  validateLocationAccess,
  validateComponentAccess,
  StockController.createStock,
);

stockRouter.delete(
  "/delete",
  authMiddleware,
  validateLocationAccess,
  StockController.deleteStock,
);

stockRouter.post(
  "/update",
  authMiddleware,
  validateLocationAccess,
  StockController.updateStock,
);

stockRouter.post(
  "/register-loss",
  authMiddleware,
  validateLocationAccess,
  StockController.registerLoss,
);

stockRouter.post(
  "/register-adjustment",
  authMiddleware,
  validateLocationAccess,
  StockController.registerAdjustment,
);

stockRouter.get(
  "/list",
  authMiddleware,
  validateBrandAccess,
  validateLocationAccess,
  StockController.listStock,
);
stockRouter.get(
  "/retrieve",
  authMiddleware,
  validateLocationAccess,
  StockController.retrieveStock,
);

stockRouter.get(
  "/movements/list",
  authMiddleware,
  validateBrandAccess,
  StockController.listMovements,
);
