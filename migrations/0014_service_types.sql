-- v113 configurable regular service types + song-stat category snapshots

ALTER TABLE services ADD COLUMN service_type_id TEXT;
ALTER TABLE services ADD COLUMN service_type_name TEXT;

-- Preserve the two historical built-in categories and any other regular titles.
UPDATE services
SET service_type_id = CASE
      WHEN lower(replace(title,' ','')) IN ('morningservice','morningchurch') THEN 'morning-church'
      WHEN lower(replace(title,' ','')) IN ('nightservice','nightchurch') THEN 'nightchurch'
      WHEN kind='event' THEN NULL
      ELSE 'legacy-' || lower(replace(replace(replace(title,' ','-'),'/','-'),'&','and'))
    END,
    service_type_name = CASE
      WHEN kind='event' THEN 'One-off services'
      WHEN lower(replace(title,' ','')) IN ('morningservice','morningchurch') THEN 'Morning Church'
      WHEN lower(replace(title,' ','')) IN ('nightservice','nightchurch') THEN 'NightChurch'
      ELSE title
    END;

ALTER TABLE song_usage ADD COLUMN service_type_key TEXT;
ALTER TABLE song_usage ADD COLUMN service_type_name TEXT;

-- Backfill historical statistics while the corresponding service still exists.
UPDATE song_usage
SET service_type_key = COALESCE(
      (SELECT CASE
         WHEN s.kind='event' THEN 'one-off'
         ELSE COALESCE(s.service_type_id,'legacy-' || lower(replace(s.title,' ','-')))
       END FROM services s WHERE s.id=song_usage.service_id),
      'one-off'
    ),
    service_type_name = COALESCE(
      (SELECT CASE
         WHEN s.kind='event' THEN 'One-off services'
         ELSE COALESCE(s.service_type_name,s.title)
       END FROM services s WHERE s.id=song_usage.service_id),
      'One-off services'
    );

CREATE INDEX IF NOT EXISTS idx_song_usage_service_type
ON song_usage(service_type_key,usage_day);
