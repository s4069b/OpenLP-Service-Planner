-- v126 application authentication + three cumulative access levels
ALTER TABLE users ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'microsoft';
ALTER TABLE users ADD COLUMN access_level INTEGER NOT NULL DEFAULT 3;
ALTER TABLE users ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_iterations INTEGER;
ALTER TABLE users ADD COLUMN microsoft_oid TEXT;
ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TEXT;
UPDATE users SET access_level=3,disabled=0 WHERE access_level IS NULL OR access_level<1;
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,email TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expiry ON auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_oidc_states (
  state TEXT PRIMARY KEY,nonce TEXT NOT NULL,code_verifier TEXT NOT NULL,return_to TEXT NOT NULL DEFAULT '/',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_oidc_states_expiry ON auth_oidc_states(expires_at);
