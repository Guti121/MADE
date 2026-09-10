import pkg from 'pg'

import { logger } from './logger.js'

// `dotenv` is loaded once, as the first import of `app.js`. Do not call
// `dotenv.config()` here.

const { Pool } = pkg

const int = (name, fallback) => {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  // Bounded pool + timeouts so one stuck query can't exhaust connections or
  // run forever on the database.
  max: int('DB_POOL_MAX', 10),
  connectionTimeoutMillis: int('DB_CONNECTION_TIMEOUT_MS', 5000),
  idleTimeoutMillis: int('DB_IDLE_TIMEOUT_MS', 30000),
  statement_timeout: int('DB_STATEMENT_TIMEOUT_MS', 15000),
  query_timeout: int('DB_QUERY_TIMEOUT_MS', 15000)
})

pool.on('error', (err) => {
  // Idle client errors would otherwise crash the process.
  logger.error({ err }, 'unexpected idle pg client error')
})
