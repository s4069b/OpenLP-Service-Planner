-- v138 song classifications
ALTER TABLE songs ADD COLUMN classifications_json TEXT NOT NULL DEFAULT '[]';

INSERT OR IGNORE INTO planner_settings(key,value_json,updated_at)
VALUES(
  'songClassificationGroups',
  '[{"id":"collection","name":"Collection","rule":"one-or-more","defaultId":"uncategorised","items":[{"id":"core","name":"Core"},{"id":"new","name":"New"},{"id":"timeless","name":"Timeless"},{"id":"uncategorised","name":"Uncategorised"}]},{"id":"review","name":"Review","rule":"zero-or-more","defaultId":"","items":[{"id":"drop-this-song","name":"Drop this song"},{"id":"try-in-future","name":"Try in the future"}]},{"id":"service-position","name":"Service position","rule":"zero-or-more","defaultId":"","items":[{"id":"opener","name":"Opener"},{"id":"closer","name":"Closer"}]}]',
  datetime('now')
);

UPDATE songs
SET classifications_json='["uncategorised"]'
WHERE classifications_json='[]' OR classifications_json IS NULL;
