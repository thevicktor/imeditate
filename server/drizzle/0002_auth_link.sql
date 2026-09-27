-- Links Better Auth users to parent profiles. Better Auth's own tables
-- (user, session, account, verification) are created by src/migrate.js.
-- PIN is set during onboarding AFTER signup, so pin_hash must be nullable.
ALTER TABLE parents ADD COLUMN IF NOT EXISTS auth_user_id text UNIQUE;
ALTER TABLE parents ALTER COLUMN pin_hash DROP NOT NULL;
