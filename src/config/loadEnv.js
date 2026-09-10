// Side-effect module: loads .env into process.env. Import this FIRST from the
// process entry point (app.js, database/run-migration.js) so that every config
// module evaluated afterwards sees the values.
import dotenv from 'dotenv'

dotenv.config({ quiet: true })
