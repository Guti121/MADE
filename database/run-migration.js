// Ad-hoc SQL runner. Reuses the app's DB config from .env.
//
//   node database/run-migration.js database/migrations/0001_type_components_global.sql
//
// The .sql file is sent as-is, so it must manage its own BEGIN/COMMIT.
import '../src/config/loadEnv.js'
import fs from 'node:fs'
import path from 'node:path'
import { pool } from '../src/config/db.js'

const file = process.argv[2]

if (!file) {
  console.error('Usage: node database/run-migration.js <path-to-sql-file>')
  process.exit(1)
}

const sqlPath = path.resolve(process.cwd(), file)
const sql = fs.readFileSync(sqlPath, 'utf8')

const client = await pool.connect()

try {
  console.log(`Running ${sqlPath} ...`)
  await client.query(sql)
  console.log('Done.')
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
