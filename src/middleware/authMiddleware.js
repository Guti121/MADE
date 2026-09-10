import jwt from 'jsonwebtoken'

import { SECRET_KEY_TOKEN } from '../config/config.js'

// Verifies the access_token JWT from the httpOnly cookie and attaches the
// decoded payload to req.user. Any verification failure (missing, expired, bad
// signature, malformed) returns the same generic 401.
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.access_token

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    req.user = jwt.verify(token, SECRET_KEY_TOKEN, { algorithms: ['HS256'] })
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
