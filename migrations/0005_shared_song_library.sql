-- v26 shared song library

CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  alternate_title TEXT NOT NULL DEFAULT '',
  authors_json TEXT NOT NULL DEFAULT '[]',
  sections_json TEXT NOT NULL DEFAULT '[]',
  verse_order TEXT NOT NULL DEFAULT '',
  music_note TEXT NOT NULL DEFAULT '',
  copyright TEXT NOT NULL DEFAULT '',
  ccli_number TEXT NOT NULL DEFAULT '',
  comments TEXT NOT NULL DEFAULT '',
  theme_name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'openlp',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_songs_title
ON songs(title);
