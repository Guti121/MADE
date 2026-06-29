import { Router } from "express";
import { locationController } from "../controllers/locationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { locationSchema } from "../shemas/locationShemas.js";

export const locationRoutes = Router();

locationRoutes.post(
  "/create-location",
  authMiddleware,
  locationController.createLocation,
);
locationRoutes.delete(
  "/delete-location",
  authMiddleware,
  locationController.deleteLocation,
);
locationRoutes.put(
  "/update-location",
  authMiddleware,
  locationController.updateLocation,
);

locationRoutes.get(
  "/list-location",
  authMiddleware,
  locationController.viewLocation,
);

locationRoutes.get(
  "/retrieve-location",
  authMiddleware,
  locationController.retrieveLocation,
);
