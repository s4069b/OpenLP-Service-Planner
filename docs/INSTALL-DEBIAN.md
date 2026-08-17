# Debian VPS installation

OpenLP Service Planner can run without Cloudflare on a Debian VPS. In this mode SQLite replaces D1 and the local filesystem replaces R2.

## Recommended platform

- Current Debian stable
- Node.js 24 or later
- npm
- Caddy (recommended) or another HTTPS reverse proxy
- A DNS name pointing to the VPS

The application process listens on `127.0.0.1:8787` by default. Do not expose that port directly to the Internet; terminate HTTPS at Caddy/nginx and reverse-proxy to it.

## 1. Create a service account and directories

As root:

```bash
useradd --system --home /var/lib/openlp-service-planner --shell /usr/sbin/nologin openlp-planner
mkdir -p /opt/openlp-service-planner /var/lib/openlp-service-planner
chown openlp-planner:openlp-planner /var/lib/openlp-service-planner
```

Copy or clone the repository into `/opt/openlp-service-planner`.

## 2. Install Node.js and dependencies

Install Node.js 24+ using your preferred trusted Node.js distribution, then:

```bash
cd /opt/openlp-service-planner
npm install
npm run validate
npm run build:vps
```

## 3. Configure the environment

```bash
cp deploy/debian/openlp-service-planner.env.example /etc/openlp-service-planner.env
chmod 600 /etc/openlp-service-planner.env
editor /etc/openlp-service-planner.env
```

At minimum set:

```text
PLANNER_PUBLIC_ORIGIN=https://planner.example.org
PLANNER_SETUP_TOKEN=a-long-random-one-time-secret
```

Keep `HOST=127.0.0.1`, `PORT=8787`, `PLANNER_TRUST_PROXY=true`, and the default data directory unless you have a reason to change them.

### Optional Microsoft SSO

Set `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` and `MICROSOFT_ALLOWED_DOMAIN`. Configure the Entra redirect URI as:

```text
https://planner.example.org/auth/microsoft/callback
```

### Optional My ChurchSuite sign-in

Set `CHURCHSUITE_OIDC_CLIENT_ID` and `CHURCHSUITE_OIDC_CLIENT_SECRET`. Configure the callback as:

```text
https://planner.example.org/auth/churchsuite/callback
```

### Optional ChurchSuite service integration

Set `CHURCHSUITE_CLIENT_ID` and `CHURCHSUITE_CLIENT_SECRET` if that integration is used.

Do not put secrets in the repository.

## 4. Initialise the database

```bash
cd /opt/openlp-service-planner
npm run db:vps
```

The SQLite database and media files are stored beneath `PLANNER_DATA_DIR` (the supplied systemd service uses `/var/lib/openlp-service-planner`).

## 5. Install systemd service

```bash
cp deploy/debian/openlp-service-planner.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now openlp-service-planner
systemctl status openlp-service-planner
```

View logs with:

```bash
journalctl -u openlp-service-planner -f
```

## 6. Configure HTTPS with Caddy

Install Caddy, then adapt `deploy/debian/Caddyfile.example` for your hostname. For example:

```caddyfile
planner.example.org {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8787
}
```

Reload Caddy and confirm `https://planner.example.org` opens successfully.

## 7. Create the first Administrator

Visit:

```text
https://planner.example.org/setup
```

Use the `PLANNER_SETUP_TOKEN` to create the first local Administrator. Then remove `PLANNER_SETUP_TOKEN` from `/etc/openlp-service-planner.env` and restart:

```bash
systemctl restart openlp-service-planner
```

## Updating

First download a **Full backup** from the Planner. Then:

```bash
cd /opt/openlp-service-planner
git pull
npm install
npm run validate
npm run db:vps
npm run build:vps
systemctl restart openlp-service-planner
```

## VPS backup note

The Planner's Full backup contains the application database and media. Also consider normal VPS-level backups of `/var/lib/openlp-service-planner` and `/etc/openlp-service-planner.env` using your server backup system. Keep the environment file secure because it contains secrets and is intentionally not included in Planner backups.
