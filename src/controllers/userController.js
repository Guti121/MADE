import { randomUUID } from 'node:crypto'

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import {
  SALT_ROUNDS,
  SECRET_KEY_TOKEN,
  REFRESH_TOKEN_SECRET,
  AUTH_COOKIE_OPTIONS
} from '../config/config.js'
import { logger } from '../config/logger.js'
import { UserModel } from '../models/usersModel.js'
import { hashToken } from '../helpers/tokenHash.js'
import { loginSchema, userSchema } from '../shemas/userShemas.js'

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// A real bcrypt hash, computed once at startup, compared against when the email
// is unknown so login response time does not reveal whether an account exists.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('unused-placeholder', SALT_ROUNDS)

// Claims embedded in both tokens. `jti` makes every token (and therefore every
// refresh token_hash) unique even for same-second re-issues for one user.
const tokenPayload = (user) => ({
  id: user.id,
  name: user.name,
  lastname: user.lastname,
  email: user.email,
  role: user.role,
  jti: randomUUID()
})

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  lastname: user.lastname,
  email: user.email,
  role: user.role
})

const signAccessToken = (user) =>
  jwt.sign(tokenPayload(user), SECRET_KEY_TOKEN, { expiresIn: '15m' })

const signRefreshToken = (user) =>
  jwt.sign(tokenPayload(user), REFRESH_TOKEN_SECRET, { expiresIn: '7d' })

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res
    .cookie('access_token', accessToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_TTL_MS
    })
    .cookie('refresh_token', refreshToken, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_TTL_MS
    })
}

const clearAuthCookies = (res) => {
  res.clearCookie('access_token', AUTH_COOKIE_OPTIONS)
  res.clearCookie('refresh_token', AUTH_COOKIE_OPTIONS)
}

// Issue a fresh refresh token, persist only its hash, return the raw token.
const issueRefreshToken = async (user) => {
  const refreshToken = signRefreshToken(user)
  await UserModel.saveRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  })
  return refreshToken
}

export class UserController {
  static async createUser (req, res) {
    try {
      const result = userSchema.safeParse(req.body)

      if (!result.success) {
        return res.status(400).json({ error: result.error.format() })
      }

      const { email } = result.data

      const existingUser = await UserModel.loginUser({ email })
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' })
      }

      const hashpassword = await bcrypt.hash(result.data.password, SALT_ROUNDS)

      const user = await UserModel.createUser({
        name: result.data.name,
        lastname: result.data.lastname,
        email: result.data.email,
        password: hashpassword
      })

      res.status(201).json(publicUser(user))
    } catch (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email already exists' })
      }
      logger.error({ err: error }, 'createUser failed')
      res.status(500).json({ error: 'Error creating user' })
    }
  }

  static async loginUser (req, res) {
    try {
      const result = loginSchema.safeParse(req.body)

      if (!result.success) {
        return res.status(400).json({ error: result.error.format() })
      }

      const { email, password } = result.data

      const user = await UserModel.loginUser({ email })

      const hash = user?.password ?? DUMMY_PASSWORD_HASH
      const passwordOk = await bcrypt.compare(password, hash)

      if (!user || !passwordOk) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      const refreshToken = await issueRefreshToken(user)
      const accessToken = signAccessToken(user)

      // Opportunistic sweep of expired sessions (fire and forget).
      UserModel.deleteExpiredSessions().catch(() => {})

      setAuthCookies(res, { accessToken, refreshToken })

      res.json({
        message: 'LOGIN SUCCESSFULLY',
        user: publicUser(user)
      })
    } catch (error) {
      logger.error({ err: error }, 'loginUser failed')
      res.status(500).json({ error: 'Login error' })
    }
  }

  static async refreshToken (req, res) {
    const token = req.cookies.refresh_token

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // 1. Signature + expiry check only. We do NOT act on the decoded payload.
    try {
      jwt.verify(token, REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] })
    } catch {
      clearAuthCookies(res)
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    try {
      // 2. Atomically consume the session row for this token. Concurrent
      //    refreshes with the same token: exactly one gets a row back.
      const session = await UserModel.consumeRefreshSession({
        tokenHash: hashToken(token)
      })

      // 3. No active session for a signature-valid token: already rotated,
      //    expired, or the user was disabled. Reject and clear cookies — do
      //    NOT revoke the user's other sessions. Treating "unknown but
      //    signature-valid" as hostile turns any leaked/old refresh token into
      //    a 7-day remote logout-DoS for that account.
      if (!session) {
        clearAuthCookies(res)
        return res.status(401).json({ error: 'Invalid or expired token' })
      }

      // 4. Rotate: issue a new pair.
      const user = {
        id: session.user_id,
        name: session.name,
        lastname: session.lastname,
        email: session.email,
        role: session.role
      }

      const newRefreshToken = await issueRefreshToken(user)
      const newAccessToken = signAccessToken(user)

      setAuthCookies(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      })

      res.json({ message: 'UPDATE TOKEN SUCCESSFULLY' })
    } catch (error) {
      logger.error({ err: error }, 'refreshToken failed')
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  static async logoutUser (req, res) {
    try {
      const token = req.cookies.refresh_token
      if (token) {
        await UserModel.deleteSession({ tokenHash: hashToken(token) })
      }

      clearAuthCookies(res)

      return res.json({ message: 'LOGOUT SUCCESSFULLY' })
    } catch (error) {
      logger.error({ err: error }, 'logoutUser failed')
      return res.status(500).json({ error: 'Logout error' })
    }
  }
}
