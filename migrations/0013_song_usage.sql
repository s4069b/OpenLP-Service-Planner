-- v109 song usage statistics: infinite export-triggered history
CREATE TABLE IF NOT EXISTS song_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  usage_day TEXT NOT NULL,
  song_id TEXT NOT NULL,
  song_title TEXT NOT NULL,
  exported_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_song_usage_service_day_song
ON song_usage(service_id,usage_day,song_id);
CREATE INDEX IF NOT EXISTS idx_song_usage_song
ON song_usage(song_id,exported_at);
CREATE INDEX IF NOT EXISTS idx_song_usage_exported
ON song_usage(exported_at);
