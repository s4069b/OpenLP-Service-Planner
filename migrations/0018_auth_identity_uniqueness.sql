-- v170: stable external identity keys must not be linked to multiple Planner accounts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_churchsuite_sub_unique
  ON users(churchsuite_sub)
  WHERE churchsuite_sub IS NOT NULL AND trim(churchsuite_sub) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_microsoft_oid_unique
  ON users(microsoft_oid)
  WHERE microsoft_oid IS NOT NULL AND trim(microsoft_oid) <> '';
