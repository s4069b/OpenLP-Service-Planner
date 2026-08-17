-- v25: service last-edited metadata
ALTER TABLE services ADD COLUMN last_edited_at TEXT;
ALTER TABLE services ADD COLUMN last_edited_by TEXT;
ALTER TABLE services ADD COLUMN last_edited_action TEXT;
