-- Time tracking per scripture (parent dashboard) + streaks are updated by the API.
ALTER TABLE progress ADD COLUMN IF NOT EXISTS time_spent_seconds int NOT NULL DEFAULT 0;
