-- v79 shared song-library revision safety
CREATE TABLE IF NOT EXISTS song_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id TEXT NOT NULL,
  song_json TEXT NOT NULL,
  saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  saved_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_song_revisions_song_saved
ON song_revisions(song_id, id DESC);
