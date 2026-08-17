-- OpenLP Service Planner v11
-- First persistent Cloudflare phase.
--
-- The planner state is intentionally stored as one versioned JSON document in
-- this phase so the proven UI can move to D1 without a large rewrite.
-- Revision checking prevents silent last-write-wins overwrites.
--
-- Later migrations can normalize services/items/audit/song-library tables
-- without changing the public UI.

CREATE TABLE IF NOT EXISTS planner_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  item_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT,
  byte_size INTEGER,
  sha256 TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_assets_service
ON media_assets(service_id);
