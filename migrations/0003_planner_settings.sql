-- v18: create planner_settings table omitted from earlier migrations

CREATE TABLE IF NOT EXISTS planner_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
