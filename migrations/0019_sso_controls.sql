-- v1.72: explicit per-user SSO permissions.
ALTER TABLE users ADD COLUMN microsoft_sso_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN churchsuite_sso_enabled INTEGER NOT NULL DEFAULT 0;

-- Preserve existing linked sign-in methods on upgrade.
UPDATE users SET microsoft_sso_enabled=1
WHERE microsoft_oid IS NOT NULL AND trim(microsoft_oid)<>'';
UPDATE users SET churchsuite_sso_enabled=1
WHERE churchsuite_sub IS NOT NULL AND trim(churchsuite_sub)<>'';
