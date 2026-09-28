-- Email verification codes (passwordless proof of inbox).
-- Dev note: codes are returned by the API only when ALLOW_DEV_CODES=true.
-- Production must deliver codes by email (SMTP) and never expose them.
CREATE TABLE IF NOT EXISTS email_codes (
  email citext PRIMARY KEY,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0
);
