import { SALT_ROUNDS, SECRET_KEY_TOKEN } from "../config/config.js";
import { UserModel } from "../models/usersModel.js";
import { loginSchema, userSchema } from "../shemas/userShemas.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class UserController {
  static async createUser(req, res) {
    try {
      // ✅ Validate with Zod
      const result = userSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.format(),
        });
      }

      // ✅ Use validated data
      const { email } = result.data;

      // ✅ Check if email exists
      const existingUser = await UserModel.loginUser(email);

      if (existingUser) {
        return res.status(400).json({
          error: "Email already exists",
        });
      }
      // the folowing fuction hashes the password
      const hashpassword = await bcrypt.hash(result.data.password, SALT_ROUNDS);
      console.log(hashpassword);

      // ✅ Create user
      const user = await UserModel.createUser({
        ...result.data,
        password: hashpassword,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error(error);

      // ✅ Handle DB unique error
      if (error.code === "23505") {
        return res.status(400).json({
          error: "Email already exists",
        });
      }

      res.status(500).json({ error: "Error creating user" });
    }
  }

  static async loginUser(req, res) {
    try {
      const result = loginSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({ error: result.error.format() });
      }

      const { email, password } = result.data;

      const user = await UserModel.loginUser({ email });

      if (!user) {
        return res.status(400).json({
          error: "Invalid credentials",
        });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);

      if (!passwordCompare) {
        return res.status(400).json({
          error: "Invalid credentials",
        });
      }
      console.log(user.id, "ID DE USUARIO");
      const refreshToken = jwt.sign(
        {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" },
      );

      //Save refresh token in DB
      await UserModel.saveRefreshToken({ user, refreshToken });
      console.log("user:", user);
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
        },
        SECRET_KEY_TOKEN,
        {
          expiresIn: "15m",
        },
      );

      res
        .cookie("access_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({
          message: "LOGIN SUCCESSFULLY",
          user: {
            id: user.id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
          },
        });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: "Login error",
      });
    }
  }

  //Refresh token
  static async refreshToken(req, res) {
    const token = req.cookies.refresh_token;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

      // Find user by id
      console.log("decoded", decoded);
      const user = await UserModel.refreshToken({ decoded, token });

      console.log("USER:", user, "REFRESH", user.refresh_token, "TOKEN", token);
      if (!user || user.refresh_token !== token) {
        console.log("error");
        return res.status(403).json({ error: "Invalid token" });
      }

      // 1. delete old token
      await UserModel.deleteSession({ token });
      console.log("datos:", {
        id: user.user_id,
        name: decoded.name,
        lastname: decoded.lastname,
        email: decoded.email,
        role: decoded.role,
      });
      // 2. create new refresh token

      const refreshToken = jwt.sign(
        {
          id: user.user_id,
          name: decoded.name,
          lastname: decoded.lastname,
          email: decoded.email,
          role: decoded.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" },
      );
      console.log("new token", refreshToken);
      // 3. save new token in DB
      await UserModel.saveRefreshToken({
        user: { id: user.user_id },
        refreshToken,
      });

      console.log(decoded, "decoded");
      // Generate new access token
      const newAccessToken = jwt.sign(
        {
          id: user.user_id,
          name: decoded.name,
          lastname: decoded.lastname,
          email: decoded.email,
          role: decoded.role,
        },
        SECRET_KEY_TOKEN,
        {
          expiresIn: "15m",
        },
      );

      res
        .cookie("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        })
        .cookie("refresh_token", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({
          message: "UPDATE TOKEN SUCCESSFULLY",
        });
    } catch (error) {
      console.log(error);
      if (error.name === "TokenExpiredError") {
        if (token) {
          await UserModel.deleteSession({ token });
        }
        return res.status(403).json({
          error: "Refresh token expired, please login again",
        });
      }
      return res.status(403).json({
        error: "Invalid token",
      });
    }
  }

  static async logoutUser(req, res) {
    try {
      const token = req.cookies.refresh_token;

      if (token) {
        await UserModel.deleteSession({ token });
      }

      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.json({
        message: "LOGOUT SUCCESSFULLY",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: "Logout error",
      });
    }
  }
}
