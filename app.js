// Load environment variables before ANY other import: config modules read
// `process.env` at evaluation time, and several are imported transitively below.
import './src/config/loadEnv.js'

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import pinoHttp from 'pino-http'

import { logger } from './src/config/logger.js'
import { pool } from './src/config/db.js'
import { CORS_ORIGINS, TRUST_PROXY, COOKIE_SECRET } from './src/config/config.js'
import { userRoutes } from './src/routes/userRoutes.js'
import { brandRoutes } from './src/routes/brandRoutes.js'
import { locationRoutes } from './src/routes/locationRoutes.js'
import { componentRouter } from './src/routes/components/componentRoutes.js'
import { stockRouter } from './src/routes/stock/stockRoutes.js'
import { jarStockRouter } from './src/routes/stock/jarStockRoutes.js'
import { formulaRouter } from './src/routes/formula/formulaRoutes.js'
import { containerRouter } from './src/routes/containers/containerRoutes.js'
import { stockContainerRouter } from './src/routes/containers/stockContainersRoutes.js'
import { saleRouter } from './src/routes/sales/saleRouters.js'

const app = express()

// How many proxy hops to trust for req.ip / req.protocol. MUST match the real
// deployment topology exactly: too high lets a client spoof X-Forwarded-For and
// bypass the per-IP rate limiter. Default: trust nothing (direct exposure).
// Set TRUST_PROXY to the hop count (e.g. 1) or a CIDR when behind a proxy/LB.
app.set('trust proxy', TRUST_PROXY)

app.use(helmet())

app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  })
)

app.use(express.json({ limit: '16kb' }))
app.use(cookieParser(COOKIE_SECRET))
app.disable('x-powered-by')

app.use(pinoHttp({ logger }))

// Liveness/readiness probe: no auth, cheap.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const limiter = (max) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, try again later' }
  })

// Tight bucket for credential-guessing surfaces; a looser one for token refresh
// (a shared NAT of legitimate users refreshes often); loose global default.
const loginLimiter = limiter(10)
const refreshLimiter = limiter(60)

app.use(limiter(1000))

app.use('/api/user/login', loginLimiter)
app.use('/api/user/create-user', loginLimiter)
app.use('/api/user/refresh-token', refreshLimiter)
app.use('/api/user', userRoutes)
app.use('/api/brand', brandRoutes)
app.use('/api/location', locationRoutes)
app.use('/api/component', componentRouter)
app.use('/api/stock', stockRouter)
app.use('/api/jar-stock', jarStockRouter)
app.use('/api/formula', formulaRouter)
app.use('/api/container', containerRouter)
app.use('/api/stock-container', stockContainerRouter)
app.use('/api/sale', saleRouter)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' })
  }

  // The one place a full error is logged. Clients only ever see a generic message.
  ;(req.log ?? logger).error({ err }, 'unhandled error')

  return res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT ?? 1234

const server = app.listen(PORT, () => {
  logger.info(`server listening on port ${PORT}`)
})

// Graceful shutdown: stop accepting connections, let in-flight requests finish,
// then drain the DB pool.
let shuttingDown = false
const shutdown = (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  logger.info({ signal }, 'shutting down')
  server.close(async () => {
    try {
      await pool.end()
    } catch (err) {
      logger.error({ err }, 'error draining pool')
    }
    process.exit(0)
  })
  // Hard cap so a stuck connection cannot block the rollout forever.
  setTimeout(() => process.exit(1), 10000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
