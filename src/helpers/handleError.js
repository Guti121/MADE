import { logger } from '../config/logger.js'

// Uniform controller error responder. Logs the full error server-side and sends
// the client a safe message. ONLY an AppError (or anything explicitly marked
// `public: true`) reveals its own message — everything else (pg errors,
// TypeErrors, third-party `status`-decorated errors) is hidden behind a
// generic message so DB/schema internals never reach the client.
export function handleError (res, error, fallback = 'Internal server error') {
  const isPublic = error?.public === true
  const status = isPublic && Number.isInteger(error.status) ? error.status : 500

  logger.error({ err: error }, fallback)

  const message =
    isPublic && typeof error?.message === 'string' && error.message
      ? error.message
      : status >= 400 && status < 500
        ? 'Bad request'
        : fallback

  return res.status(status).json({ error: message })
}
