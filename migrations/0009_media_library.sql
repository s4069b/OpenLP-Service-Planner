-- v78 retained OpenLP Planner media library
ALTER TABLE media_assets ADD COLUMN retained INTEGER NOT NULL DEFAULT 0;
ALTER TABLE media_assets ADD COLUMN media_type TEXT;
ALTER TABLE media_assets ADD COLUMN source_library_id TEXT;
ALTER TABLE media_assets ADD COLUMN library_group_id TEXT;

CREATE INDEX IF NOT EXISTS idx_media_assets_retained_type
ON media_assets(retained, media_type);

CREATE INDEX IF NOT EXISTS idx_media_assets_source_library
ON media_assets(source_library_id);

-- Backfill type for existing service-specific assets from their owning item.
UPDATE media_assets
SET media_type = COALESCE(
  (SELECT json_extract(si.item_json,'$.type')
   FROM service_items si
   WHERE si.service_id=media_assets.service_id AND si.id=media_assets.item_id),
  CASE WHEN content_type LIKE 'video/%' THEN 'video' ELSE 'images' END
)
WHERE media_type IS NULL;
