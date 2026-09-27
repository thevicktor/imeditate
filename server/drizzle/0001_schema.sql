-- iMeditate full schema (V1 + post-V1 tables). Applied automatically on first
-- `docker compose up` via /docker-entrypoint-initdb.d. Forward-only: future
-- changes go in 0002_*.sql, never by editing this file.
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- identity (V1)
CREATE TABLE IF NOT EXISTS parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 40),
  age_group text NOT NULL CHECK (age_group IN ('4-7','8-11','12-17')),
  soldier_rank text NOT NULL DEFAULT 'Recruit',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS children_parent_idx ON children(parent_id);

-- content (V1 + full)
CREATE TABLE IF NOT EXISTS themes (
  id text PRIMARY KEY,
  title text NOT NULL,
  is_free boolean NOT NULL DEFAULT false,
  min_entitlement text
);
CREATE TABLE IF NOT EXISTS scriptures (
  id text PRIMARY KEY,
  theme_id text NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  ref text NOT NULL,
  text text NOT NULL,
  phrases jsonb NOT NULL DEFAULT '[]',
  audio_url text,
  questions jsonb NOT NULL DEFAULT '{}',
  sort int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS progress (
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  scripture_id text NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'ponder' CHECK (stage IN ('ponder','mutter','roar','done')),
  ponder_artifact_url text,
  mutter_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, scripture_id)
);
CREATE TABLE IF NOT EXISTS artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  scripture_id text NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  png_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- progression / economy (tables ship now; features gated post-V1)
CREATE TABLE IF NOT EXISTS ranks (
  name text PRIMARY KEY,
  level int NOT NULL,
  xp_required int NOT NULL,
  story_beat text
);
CREATE TABLE IF NOT EXISTS jewel_wallets (
  child_id uuid PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  balance int NOT NULL DEFAULT 0 CHECK (balance >= 0)
);
CREATE TABLE IF NOT EXISTS jewel_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  delta int NOT NULL CHECK (delta <> 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jewel_ledger_child_idx ON jewel_ledger(child_id);
CREATE TABLE IF NOT EXISTS shop_items (
  sku text PRIMARY KEY,
  title text NOT NULL,
  price_jewels int NOT NULL CHECK (price_jewels > 0),
  art_url text,
  rank_required text REFERENCES ranks(name)
);
CREATE TABLE IF NOT EXISTS owned_items (
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  sku text NOT NULL REFERENCES shop_items(sku) ON DELETE RESTRICT,
  equipped boolean NOT NULL DEFAULT false,
  PRIMARY KEY (child_id, sku)
);
CREATE TABLE IF NOT EXISTS streaks (
  child_id uuid PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  current int NOT NULL DEFAULT 0,
  longest int NOT NULL DEFAULT 0,
  last_done_date date
);
CREATE TABLE IF NOT EXISTS badges (
  code text PRIMARY KEY,
  title text NOT NULL,
  art_url text,
  rule jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS earned_badges (
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES badges(code) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, code)
);
CREATE TABLE IF NOT EXISTS devices (
  expo_push_token text PRIMARY KEY,
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reminder_settings (
  parent_id uuid PRIMARY KEY REFERENCES parents(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  hour int NOT NULL DEFAULT 19,
  days int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}'
);

-- payments (post-V1, schema ready)
CREATE TABLE IF NOT EXISTS products (
  sku text PRIMARY KEY,
  platform text NOT NULL,
  type text NOT NULL CHECK (type IN ('sub','pack')),
  entitlement text NOT NULL
);
CREATE TABLE IF NOT EXISTS entitlements (
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  entitlement text NOT NULL,
  expires_at timestamptz,
  PRIMARY KEY (parent_id, entitlement)
);
CREATE TABLE IF NOT EXISTS purchase_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  platform text NOT NULL,
  product_sku text NOT NULL REFERENCES products(sku),
  revenuecat_id text UNIQUE,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- messages + adult plan (post-V1)
CREATE TABLE IF NOT EXISTS pastor_messages (
  id text PRIMARY KEY,
  title text NOT NULL,
  audio_url text,
  transcript_url text,
  license_ref text,
  sort int NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS adult_progress (
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  scripture_id text NOT NULL REFERENCES scriptures(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'ponder',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, scripture_id)
);

-- analytics (aggregated, no PII)
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  event text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_event_idx ON events(event);

-- seeds: ranks (V1 ladder + General reserved) and the free theme shell
INSERT INTO ranks (name, level, xp_required, story_beat) VALUES
  ('Recruit', 0, 0, 'Meet your Soldier'),
  ('Private', 1, 1, 'First scripture complete'),
  ('Sergeant', 2, 2, 'Two scriptures complete'),
  ('Captain', 3, 3, 'Sound Mind complete'),
  ('General', 4, 8, 'Reserved: full-plan pacing')
ON CONFLICT (name) DO NOTHING;
INSERT INTO themes (id, title, is_free) VALUES
  ('sound-mind', 'Sound Mind', true)
ON CONFLICT (id) DO NOTHING;
