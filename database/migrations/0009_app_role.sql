-- Migration: least-privilege application role.
--
-- The app must NOT connect as `postgres` (superuser). This creates a dedicated
-- login role with only DML on the application tables — no DDL, no superuser, so
-- a SQL-injection or logic bug cannot drop tables, read pg_shadow, or use
-- COPY ... FROM PROGRAM.
--
-- This file contains NO password on purpose. Run it once as a superuser, then
-- set the password out-of-band with a value from your secret manager:
--
--     psql "$SUPERUSER_URL" -f database/migrations/0009_app_role.sql
--     psql "$SUPERUSER_URL" -c "ALTER ROLE made_app PASSWORD '<generated>'"
--
-- The role is created NOLOGIN and stays unusable until that password is set.
-- Then point DB_USER=made_app / DB_PASSWORD=<generated> at the deployment.
--
-- Idempotent.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'made_app') THEN
    CREATE ROLE made_app NOLOGIN;
  END IF;
END
$$;

-- current_database() so this works regardless of what the database is named
-- (GRANT ... ON DATABASE needs a literal identifier, hence the EXECUTE format).
DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO made_app', current_database());
END
$$;
GRANT USAGE ON SCHEMA public TO made_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO made_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO made_app;

-- Apply the same grants to tables/sequences created by future migrations.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO made_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO made_app;

-- Prevent the app role (and PUBLIC) from creating objects in the schema
-- (Postgres < 15 grants CREATE on public to PUBLIC by default).
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
