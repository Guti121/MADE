import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  validateComponentAccess,
  validateContainerAccess,
  validateLocationAccess,
} from "../../middleware/accessMiddleware.js";
import { StockController } from "../../controllers/stock/stockController.js";
import { StockContainerController } from "../../controllers/containers/stockContainerController.js";

export const stockContainerRouter = Router();

stockContainerRouter.post(
  "/create",
  authMiddleware,
  validateLocationAccess,
  validateContainerAccess,
  StockContainerController.createStockContainer,
);

stockContainerRouter.delete(
  "/delete",
  authMiddleware,
  validateLocationAccess,
  StockContainerController.deleteStockContainer,
);

stockContainerRouter.post(
  "/update",
  authMiddleware,
  validateLocationAccess,
  StockContainerController.updateStockContainer,
);

stockContainerRouter.post(
  "/register-loss",
  authMiddleware,
  validateLocationAccess,
  StockContainerController.registerLossContainer,
);

stockContainerRouter.post(
  "/register-adjustment",
  authMiddleware,
  validateLocationAccess,
  StockContainerController.registerAdjustmentContainer,
);

stockContainerRouter.get(
  "/list",
  authMiddleware,
  validateLocationAccess,
  StockContainerController.retrieveStockContainer,
);
