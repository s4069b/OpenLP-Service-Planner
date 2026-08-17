-- v90 retained OpenLP Planner media folders
CREATE TABLE IF NOT EXISTS media_library_folders (
  id TEXT PRIMARY KEY,
  media_type TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_library_folders_type_name
ON media_library_folders(media_type, name COLLATE NOCASE);

ALTER TABLE media_assets ADD COLUMN library_folder_id TEXT;

CREATE INDEX IF NOT EXISTS idx_media_assets_library_folder
ON media_assets(library_folder_id);
