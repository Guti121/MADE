import { pool } from '../config/db.js'

export class UserModel {
  // Create user. Role is forced server-side (never taken from the request).
  static async createUser ({ name, email, password, lastname }) {
    const query = `
      INSERT INTO users (name, email, password, location_id, role, lastname)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, lastname, email, role;
    `

    const values = [name, email, password, null, 'owner', lastname]
    const result = await pool.query(query, values)
    return result.rows[0]
  }

  // Full row (incl. password hash) — used only by the login flow to verify
  // credentials and mint tokens. Never returned to a client.
  static async loginUser ({ email }) {
    const query = 'SELECT * FROM users WHERE email = $1 AND state = true'
    const result = await pool.query(query, [email])
    return result.rows[0]
  }

  static async saveRefreshToken ({ userId, tokenHash, expiresAt }) {
    const query = `
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id;
    `
    const result = await pool.query(query, [userId, tokenHash, expiresAt])
    return result.rows[0]
  }

  // Atomically CONSUME a refresh token: delete its session row and return the
  // owning user in a single statement. `DELETE ... RETURNING` takes a row lock,
  // so two concurrent refreshes carrying the same token can never both succeed
  // — exactly one gets a row back, the other gets undefined. Only consumes a
  // row that is unexpired and whose user is still enabled.
  static async consumeRefreshSession ({ tokenHash }) {
    const query = `
      DELETE FROM user_sessions s
      USING users u
      WHERE s.token_hash = $1
        AND s.user_id = u.id
        AND s.expires_at > now()
        AND u.state = true
      RETURNING s.user_id AS user_id,
                u.name     AS name,
                u.lastname AS lastname,
                u.email    AS email,
                u.role     AS role;
    `
    const result = await pool.query(query, [tokenHash])
    return result.rows[0]
  }

  static async deleteSession ({ tokenHash }) {
    const query = 'DELETE FROM user_sessions WHERE token_hash = $1 RETURNING id;'
    const result = await pool.query(query, [tokenHash])
    return result.rows[0]
  }

  // Revoke every session for a user (e.g. an explicit "log out everywhere").
  static async deleteAllUserSessions ({ userId }) {
    const query = 'DELETE FROM user_sessions WHERE user_id = $1;'
    await pool.query(query, [userId])
  }

  static async deleteExpiredSessions () {
    await pool.query('DELETE FROM user_sessions WHERE expires_at < now();')
  }
}
