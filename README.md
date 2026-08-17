# OpenLP Service Planner

**Current release: v1.74**

OpenLP Service Planner is a collaborative web application for preparing services for OpenLP. It provides shared service plans, song and media libraries, Bible/text items, OpenLP `.osz` export, projector-copy readiness, user access controls, optional Microsoft/My ChurchSuite sign-in, optional ChurchSuite integration, and Administrator backup/restore.

It supports two deployment targets from the same repository:

- **Cloudflare Workers** — D1 database + R2 media storage.
- **Debian VPS** — SQLite database + filesystem media storage, normally behind Caddy or another HTTPS reverse proxy.

## Installation

### Cloudflare

See **[Cloudflare installation](docs/INSTALL-CLOUDFLARE.md)**.

Quick outline:

```bash
npm install
npx wrangler d1 create openlp-service-planner
npx wrangler r2 bucket create openlp-service-planner-media
# Put your D1 database ID in wrangler.toml
npm run validate
npm run db:remote
npm run deploy
```

### Debian VPS

See **[Debian VPS installation](docs/INSTALL-DEBIAN.md)**.

The supplied `deploy/debian/` directory contains an environment example, hardened systemd unit and Caddy example.

## First Administrator

A fresh installation can create its first local Administrator using a temporary `PLANNER_SETUP_TOKEN` and `/setup`. Remove the setup token immediately afterwards.

Microsoft SSO and My ChurchSuite OIDC are optional. ChurchSuite service-plan integration is separate from My ChurchSuite login.

## Validation

Before deploying a change:

```bash
npm install
npm run validate
```

The validation suite checks browser JavaScript, project quality rules, all database migrations, Cloudflare TypeScript/dry-run deployment, and the Debian/VPS build and smoke test.

## Backups

Administrators can download:

- **Full backup** — database plus referenced media; recommended for disaster recovery or moving an installation.
- **Database-only backup** — application data without media.

Restore validates the archive before replacing data and uses staged media during full restore. Existing sessions are invalidated after a successful restore.

Always make a fresh Full backup before upgrades or restore operations.

## Authentication and access

The Planner supports:

- local **OpenLP Planner User** accounts;
- Microsoft Entra ID SSO, restricted to the configured domain;
- My ChurchSuite OpenID Connect sign-in.

External identities are linked using stable provider identifiers rather than email addresses. New self-enrolled users start at the lowest access level and require an existing Administrator to grant Planner or Administrator access.

## Security

Do not commit `.dev.vars`, VPS environment files, OAuth client secrets, setup/recovery tokens, database files or media storage. The repository `.gitignore` excludes the normal local copies.

For a public repository, review `wrangler.toml` before committing and ensure it contains **the zero placeholder D1 ID, not a production database ID**.

## Known limitations / work still to do

v1.74 is intended as a stable security/portability baseline, but there is still work worth doing:

- **Local-password hardening:** PBKDF2 currently uses the established project cost; a higher cost should be benchmarked on Cloudflare Workers before introducing transparent password rehashing.
- **Local Administrator MFA:** local Planner accounts do not yet have built-in MFA. Where practical, prefer an organisation SSO provider with MFA for privileged users.
- **Session idle timeout:** sessions have an absolute expiry but not a separate inactivity timeout.
- **OIDC library:** token verification is implemented in-project; replacing it with a well-maintained JOSE/OIDC library is desirable after cross-platform testing.
- **CSS maintenance:** the UI stylesheet has accumulated historical overrides. A careful consolidation/refactor would improve maintainability, but should be done separately from functional changes.
- **Large Cloudflare restores:** full restore uploads remain subject to Cloudflare's request-size limit for the account/plan. The restore implementation streams data to avoid Worker-memory duplication, but cannot bypass the platform upload ceiling.
- **Interrupted staged restore cleanup:** an abrupt process termination during a restore can theoretically leave unreferenced staged media. It should not make that media live, but periodic cleanup would be useful.
- **Reproducible dependency installs:** commit the generated `package-lock.json` after running `npm install`, then change CI to `npm ci` for fully locked builds.
- **Deployment-specific SSO wording:** some user-facing Microsoft SSO wording may reflect the configured organisation/domain and should be reviewed when deploying this repository for another church.

## OpenLP compatibility

The project has been developed around OpenLP **3.1.7** service export. Test exported `.osz` files with the OpenLP version used on your projection computer before relying on a new Planner release in a live service.

## Repository layout

```text
src/              Cloudflare Worker/application backend
public/           Browser application and static assets
migrations/       D1/SQLite schema migrations
server/           Debian/Node compatibility layer
scripts/          Validation and vendoring helpers
deploy/debian/    systemd, environment and Caddy examples
docs/             Installation and security documentation
.github/           CI and Dependabot configuration
```

## Licence

OpenLP Service Planner is released under the permissive **MIT License**. See [LICENSE](LICENSE).
