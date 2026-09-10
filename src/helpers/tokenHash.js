import { createHash } from 'node:crypto'

// Refresh tokens are stored only as a SHA-256 hash. A DB read therefore yields
// no usable session token. The token itself is a high-entropy signed JWT, so a
// plain (unsalted) hash is sufficient here.
export const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex')
