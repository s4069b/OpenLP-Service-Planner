-- v165 MyChurchSuite OIDC identity mapping
ALTER TABLE users ADD COLUMN churchsuite_sub TEXT;
CREATE INDEX IF NOT EXISTS idx_users_churchsuite_sub ON users(churchsuite_sub);
