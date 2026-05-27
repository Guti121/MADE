import { Router } from "express";
import { BrandController } from "../controllers/brandController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const brandRoutes = Router();

brandRoutes.post("/create-brand", authMiddleware, BrandController.createBrand);
brandRoutes.delete(
  "/delete-brand",
  authMiddleware,
  BrandController.deleteBrand,
);
brandRoutes.put("/update-brand", authMiddleware, BrandController.updateBrand);
brandRoutes.get("/view-brand", authMiddleware, BrandController.viewBrand);
