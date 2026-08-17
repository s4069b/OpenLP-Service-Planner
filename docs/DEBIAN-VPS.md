# Debian VPS deployment

The VPS runtime uses the same `src/worker.ts` application as Cloudflare.

Instead of Cloudflare bindings it supplies compatible local adapters:

- **D1 → SQLite** (`node:sqlite`)
- **R2 → local filesystem**
- **Workers Assets → local `public/` files**
- **Worker runtime → Node HTTP server**

No separate Planner application is maintained.

## Recommended platform

- Debian 12 or later
- Node.js 24
- Caddy or nginx providing HTTPS
- At least 1 GB RAM for a small deployment
- Disk space appropriate for the media library/backups

The Node server binds to `127.0.0.1:8787` by default and should sit behind an
HTTPS reverse proxy.

## Install

```bash
sudo mkdir -p /opt/openlp-service-planner
sudo mkdir -p /var/lib/openlp-service-planner
sudo useradd --system --home /var/lib/openlp-service-planner --shell /usr/sbin/nologin openlp-planner || true
sudo chown -R openlp-planner:openlp-planner /var/lib/openlp-service-planner
```

Copy the repository into `/opt/openlp-service-planner`, then:

```bash
cd /opt/openlp-service-planner
sudo npm install
sudo npm run check:vps
sudo npm run test:vps
sudo npm run build:vps
```

`build:vps` creates the disposable `.vps-dist/worker.mjs` bundle before the
hardened systemd service starts. The service itself only reads the application
tree and writes to the configured data directory.

Copy the environment example:

```bash
sudo cp deploy/debian/openlp-service-planner.env.example /etc/openlp-service-planner.env
sudo chmod 600 /etc/openlp-service-planner.env
sudo editor /etc/openlp-service-planner.env
```

Set at minimum `PLANNER_PUBLIC_ORIGIN` and choose at least one Administrator setup/sign-in path. Microsoft SSO is optional; a fresh installation can instead use `PLANNER_SETUP_TOKEN` to create a local Administrator.

## Database

SQLite migrations are applied automatically when the VPS server starts.
They can also be applied explicitly:

```bash
npm run db:vps
```

The default development data directory is `./data`. The systemd example uses:

```text
/var/lib/openlp-service-planner/planner.sqlite
/var/lib/openlp-service-planner/media/
```

SQLite uses WAL mode and a busy timeout. This is appropriate for the modest
concurrency expected by this application. Keep the SQLite database and media
directory on local reliable storage, not a network filesystem.

## Build

The VPS build uses esbuild to bundle the same Worker source for Node:

```bash
npm run build:vps
```

The generated `.vps-dist/` directory is disposable and should not be committed.

## systemd

```bash
sudo cp deploy/debian/openlp-service-planner.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now openlp-service-planner
sudo systemctl status openlp-service-planner
```

## HTTPS reverse proxy

A Caddy example is in `deploy/debian/Caddyfile.example`.

Change `planner.example.org` to the real hostname and arrange DNS to point at
the VPS. The Planner's session cookie is `Secure`, so production access should
be HTTPS.

If using nginx instead, proxy to `http://127.0.0.1:8787` and preserve Host /
X-Forwarded-Proto. Set `PLANNER_PUBLIC_ORIGIN` to the external HTTPS origin.

## First Administrator

The first Administrator does **not** need a Microsoft account.

For the most portable initial setup, set a long random value in
`/etc/openlp-service-planner.env`:

```text
PLANNER_SETUP_TOKEN=a-long-random-secret
```

Restart the service, then browse to:

```text
https://planner.example.org/setup
```

Enter the setup token and create the first Administrator with an email address
and a password of at least 12 characters. The account is a normal local Planner
account with Administrator access.

After it succeeds, remove `PLANNER_SETUP_TOKEN` from the environment file and:

```bash
sudo systemctl restart openlp-service-planner
```

The setup route also refuses to create another account once an enabled
Administrator exists.

### Optional Microsoft bootstrap

If Microsoft SSO is configured, you may instead set:

```text
PLANNER_BOOTSTRAP_ADMIN_EMAIL=admin@example.org
```

If no enabled Administrator exists, that exact Microsoft user becomes the first
Administrator on successful SSO login. Remove the setting afterwards.

## Moving an existing Cloudflare installation to the VPS

The application backup format is shared. The simplest migration is:

1. On Cloudflare, download a **full backup**.
2. Deploy a fresh VPS instance and establish its first Administrator.
3. Sign in to the VPS Planner.
4. Restore the full backup in Settings.
5. Check user permissions, media, songs and a representative service export.

The full backup contains database rows and media bytes, so treat it as
sensitive data.

## Update

```bash
cd /opt/openlp-service-planner
# replace/update the source tree
npm install
npm run check:vps
npm run test:vps
npm run build:vps
sudo systemctl restart openlp-service-planner
```

The next start applies any new SQLite migrations.


## Emergency Administrator recovery

Temporarily add `PLANNER_ADMIN_RECOVERY_TOKEN=<long-random-value>` to `/etc/openlp-service-planner.env`, restart the service, visit `/admin-recovery`, reset an enabled local Administrator, then remove the token and restart immediately. Without the token the route is 404.


## My ChurchSuite sign-in

My ChurchSuite member authentication uses a separate ChurchSuite OAuth App from the
ChurchSuite API credentials used for Planning sync. Add these to
`/etc/openlp-service-planner.env`:

```text
CHURCHSUITE_OIDC_CLIENT_ID=...
CHURCHSUITE_OIDC_CLIENT_SECRET=...
```

Register `https://YOUR-DOMAIN/auth/churchsuite/callback` with ChurchSuite,
restart the service, then enable **Allow My ChurchSuite member sign-in** in
Planner Settings. First-time My ChurchSuite users are always created with
ChurchSuite Service list access only.
