-- v13 structured collaboration tables

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date_iso TEXT NOT NULL,
  date_display TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'Default',
  published INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL DEFAULT 'regular',
  downloaded_for_device_at TEXT,
  downloaded_snapshot TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_items (
  id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  item_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, service_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_items_service_position
ON service_items(service_id, position);

CREATE TABLE IF NOT EXISTS service_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_audit_service_created
ON service_audit(service_id, created_at DESC);
