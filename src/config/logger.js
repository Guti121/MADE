import pino from 'pino'

import { IS_PRODUCTION } from './config.js'

// Single app logger. In production it emits JSON on stdout (one line per event)
// for a log collector to pick up; in development it pretty-prints.
//
// NEVER log tokens, password hashes, full user rows, raw request bodies, or
// full driver error objects. The redact list and the custom `err` serializer
// below are the guardrails — keep them tight.
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (IS_PRODUCTION ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'access_token',
      'refresh_token',
      '*.refresh_token',
      'authorization',
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["cookie"]',
      'req.headers["authorization"]',
      // pino-http serializes res.getHeaders(), which includes Set-Cookie =
      // the freshly minted access/refresh JWTs on every login and refresh.
      'res.headers["set-cookie"]',
      'res.headers["Set-Cookie"]'
    ],
    remove: true
  },
  serializers: {
    // pino's default `err` serializer copies every enumerable own property.
    // A node-postgres DatabaseError carries detail / where / internalQuery /
    // schema / table / constraint — PII (emails in unique-violation detail),
    // token hashes, and schema internals. Whitelist instead.
    err: (e) => {
      if (!e || typeof e !== 'object') return e
      return {
        type: e.name,
        message: e.message,
        code: e.code,
        status: e.status,
        stack: e.stack
      }
    }
  },
  transport: IS_PRODUCTION
    ? undefined
    : { target: 'pino-pretty', options: { translateTime: 'SYS:standard' } }
})
