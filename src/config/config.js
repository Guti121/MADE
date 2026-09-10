// Central config. `dotenv` is loaded as the very first import of `app.js`, so
// `process.env` is already populated by the time this module is evaluated.
// No secret has a fallback: a missing value is a hard startup failure, never a
// silent downgrade to a weaker/known value.

function required (name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const NODE_ENV = process.env.NODE_ENV ?? 'development'
if (!['development', 'production', 'test'].includes(NODE_ENV)) {
  throw new Error(`NODE_ENV must be development | production | test (got "${NODE_ENV}")`)
}
export const IS_PRODUCTION = NODE_ENV === 'production'

// In production every one of these must be set explicitly; in dev they may fall
// back so `npm run dev` works out of the box.
const requiredInProd = (name, devFallback) => {
  if (IS_PRODUCTION) return required(name)
  return process.env[name] || devFallback
}

export const SECRET_KEY_TOKEN = required('SECRET_KEY_TOKEN')
export const REFRESH_TOKEN_SECRET = required('REFRESH_TOKEN_SECRET')
if (SECRET_KEY_TOKEN === REFRESH_TOKEN_SECRET) {
  throw new Error('SECRET_KEY_TOKEN and REFRESH_TOKEN_SECRET must be different')
}

export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 12)
if (!Number.isInteger(SALT_ROUNDS) || SALT_ROUNDS < 12) {
  throw new Error('SALT_ROUNDS must be an integer >= 12')
}

// Cookie options shared by every auth cookie (access + refresh). `secure` is
// only dropped for local HTTP development.
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: IS_PRODUCTION
}

// Allowed browser origins (comma-separated). Required in production.
export const CORS_ORIGINS = (
  requiredInProd('CORS_ORIGIN', 'http://localhost:5173') || ''
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

// Proxy hops to trust for req.ip. "false" (trust nothing) unless TRUST_PROXY is
// set. Accepts a hop count ("1"), "true"/"false", or a CIDR / comma list.
const rawTrustProxy = process.env.TRUST_PROXY
export const TRUST_PROXY =
  rawTrustProxy === undefined || rawTrustProxy === '' || rawTrustProxy === 'false'
    ? false
    : rawTrustProxy === 'true'
      ? true
      : /^\d+$/.test(rawTrustProxy)
        ? Number(rawTrustProxy)
        : rawTrustProxy

// Signs cookies; required in production, optional in dev.
export const COOKIE_SECRET = requiredInProd('COOKIE_SECRET', undefined)
