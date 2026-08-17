-- v97 cached public ChurchSuite service-plan directory
CREATE TABLE IF NOT EXISTS churchsuite_plan_directory_cache (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  plans_json TEXT NOT NULL DEFAULT '[]',
  synced_at TEXT,
  range_start TEXT,
  range_end TEXT
);

INSERT OR IGNORE INTO churchsuite_plan_directory_cache(id,plans_json)
VALUES(1,'[]');
