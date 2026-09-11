// One-shot first-deploy setup: creates every table (schema.sql) and the
// least-privilege app role (migrations/0009_app_role.sql) in a single command.
//
//   npm run db:setup
//   node database/setup.js
//
// Prerequisites: DB_* in .env / the environment must point at an EMPTY
// database, connected as a user that can CREATE TABLE/TYPE/ROLE (a superuser,
// or your Postgres host's admin user — NOT `made_app`, which is created here
// specifically WITHOUT that privilege).
//
// This does NOT run migrations 0001-0011: schema.sql already includes their
// effects (see the note at the top of that file). Those files stay in
// database/migrations/ only for databases that were already partially
// migrated one-by-one before this script existed. Any NEW schema change
// should be a fresh file starting at 0012, applied with
// `node database/run-migration.js <file>` as before — this script only covers
// the from-scratch case.
import '../src/config/loadEnv.js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/config/db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(here, 'schema.sql')
const rolePath = path.join(here, 'migrations', '0009_app_role.sql')

async function run (client, label, filePath) {
  console.log(`\n-> ${label} (${path.relative(process.cwd(), filePath)})`)
  const sql = fs.readFileSync(filePath, 'utf8')
  await client.query(sql)
  console.log('   done.')
}

const client = await pool.connect()

try {
  await run(client, 'Creating tables, types and constraints', schemaPath)
  await run(client, 'Creating least-privilege app role (made_app, NOLOGIN)', rolePath)

  console.log(`
Database setup complete. Two manual steps remain (on purpose — this script
never chooses or prints a password for you):

  1. Give the app role a real password, from a secret manager, not this repo:
       ALTER ROLE made_app LOGIN PASSWORD '<generate a strong one>';

  2. Point the app's runtime environment at it instead of the admin user that
     just ran this script:
       DB_USER=made_app
       DB_PASSWORD=<the password from step 1>

Then start the app and check GET /api/health.
`)
} catch (error) {
  console.error('\nSetup failed:', error.message)
  if (error.code === '42P07' || error.code === '42710') {
    console.error(
      'Hint: this usually means the database is not empty (tables, types, or ' +
      'the made_app role already exist). setup.js is for a brand-new database ' +
      'only; for an existing one, apply the specific migration you need with ' +
      '`node database/run-migration.js <file>`.'
    )
  }
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
