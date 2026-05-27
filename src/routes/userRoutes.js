import { Router } from "express";
import { UserController } from "../controllers/userController.js";

export const userRoutes = Router();

userRoutes.post("/create-user", UserController.createUser);
userRoutes.post("/login", UserController.loginUser);
userRoutes.post("/refresh-token", UserController.refreshToken);
userRoutes.post("/logout", UserController.logoutUser);
