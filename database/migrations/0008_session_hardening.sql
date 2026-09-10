-- Migration: refresh-token session hardening.
--
-- Refresh tokens are no longer stored in plaintext. `user_sessions` now keeps
-- only a SHA-256 hash of the token plus an explicit expiry, so a DB read yields
-- nothing replayable and expired rows can be swept.
--
-- The JWT signing secrets are rotated as part of this change, so every existing
-- session is invalid regardless — we drop the old plaintext column outright.
--
-- Re-runnable. Single transaction.

BEGIN;

ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;

-- Old plaintext sessions cannot be migrated (and are being invalidated anyway).
DELETE FROM user_sessions WHERE token_hash IS NULL;

ALTER TABLE user_sessions DROP COLUMN IF EXISTS refresh_token;

ALTER TABLE user_sessions ALTER COLUMN token_hash SET NOT NULL;
ALTER TABLE user_sessions ALTER COLUMN expires_at SET NOT NULL;

ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_token_hash_key;
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);

COMMIT;
