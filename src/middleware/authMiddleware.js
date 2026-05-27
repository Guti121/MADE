import { SECRET_KEY_TOKEN } from "../config/config.js";
import jwt from "jsonwebtoken";
// the following middleware verify the token and return info of user
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.access_token;
  console.log(token);
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  console.log(token);
  try {
    const decoded = jwt.verify(token, SECRET_KEY_TOKEN);
    console.log(decoded, "DECODE MIDDLEWARE");
    req.user = decoded; //Save user Info
    next();
  } catch (error) {
    return res.status(401).json({ error: "Access token expired" });
  }
};
