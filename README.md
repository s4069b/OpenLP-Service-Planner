# OpenLP Service Planner

**Current release: v1.80.1**

OpenLP Service Planner is a web application for planning church services and exporting them for OpenLP. It includes a shared Song Library, service templates, image/video/PDF/Bible items, OpenLP `.osz` export, optional ChurchSuite integration, and optional SongSelect-assisted song import workflows.

The application can be deployed to **Cloudflare Workers + D1 + R2** or to a **Debian VPS**. Authentication can use local Planner users, Microsoft Entra ID, and/or MyChurchSuite OIDC depending on your configuration.

## Highlights

- Plan services ahead of time and export OpenLP service files.
- Shared Song Library with classifications, verse order and duplicate/merge tools.
- Service templates with default OpenLP themes and optional ChurchSuite sync behaviour.
- Images, sermon images, video, PDFs and Bible passages.
- Optional ChurchSuite service-plan and song-library integration.
- Optional SongSelect guided download workflow.
- Optional experimental Edge/Chrome SongSelect browser extension for Administrators.
- Home dashboard, Services list, readiness/download status and audit information.
- Responsive desktop/mobile interface.

## Requirements

- Node.js **24 or newer**
- npm
- For Cloudflare deployment: a Cloudflare account with Workers, D1 and R2
- For VPS deployment: Debian/Linux with Node.js 24 and a reverse proxy such as nginx or Caddy

## Quick start for development

```bash
git clone <your-repository-url>
cd openlp-service-planner
npm install
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev
```

Fill in only the identity/integration values you intend to use in `.dev.vars`. Do not commit `.dev.vars`.

## Cloudflare deployment

1. Create a D1 database:
   ```bash
   npx wrangler d1 create openlp-service-planner
   ```
2. Create an R2 bucket:
   ```bash
   npx wrangler r2 bucket create openlp-service-planner-media
   ```
3. Edit `wrangler.toml`:
   - replace the all-zero placeholder `database_id` with your D1 database ID
   - change `bucket_name` if your R2 bucket uses a different name
4. Apply migrations:
   ```bash
   npm run db:remote
   ```
5. Add required secrets with `wrangler secret put ...`, or configure them in the Cloudflare dashboard.
6. Deploy:
   ```bash
   npm run deploy
   ```

See `.dev.vars.example` for the available identity and ChurchSuite values.

## Debian VPS deployment

See [`docs/DEBIAN-VPS.md`](docs/DEBIAN-VPS.md) for the VPS installation and update process.

Useful commands:

```bash
npm run db:vps
npm run test:vps
npm run start:vps
```

## First Administrator

A fresh install can establish its first Administrator using either `PLANNER_SETUP_TOKEN` or `PLANNER_BOOTSTRAP_ADMIN_EMAIL`, as described in `.dev.vars.example`. Remove the bootstrap/setup value after the first Administrator exists.

## ChurchSuite

ChurchSuite is optional. When enabled, the Planner can sync configured service-plan components, map ChurchSuite service-plan types, retrieve assigned people where permitted, compare the ChurchSuite Song Library with the OpenLP Song Library, and provide express/default sync workflows.

ChurchSuite API credentials belong in deployment secrets, not source control.

## SongSelect

The normal SongSelect workflow is **guided download**: the Planner opens SongSelect using the known title or CCLI number, the signed-in user downloads Lyrics through SongSelect, and the file is imported into the Planner for review and duplicate/merge handling.

The optional **SongSelect Browser Bridge (Experimental)** is Administrator-only and disabled by default. Its source is included in:

```text
songselect-openlp-extension/
```

A packaged ZIP is also served from:

```text
public/downloads/songselect-openlp-extension.zip
```

The extension has an Options page where a self-hosting administrator enters the URL of their own Planner deployment. It is a Chromium Manifest V3 extension and can be loaded unpacked in Edge or Chrome for testing.

## Validation

Run:

```bash
npm run check:browser
npm run test:migrations
npm run check:cloudflare
npm run test:vps
```

or:

```bash
npm run validate
```

GitHub Actions runs Cloudflare and VPS portability checks on pushes and pull requests.

## Repository hygiene

Do not commit:

- `.dev.vars`
- `.env*`
- `node_modules/`
- `.wrangler/`
- generated VPS/Cloudflare build directories
- generated `worker-configuration.d.ts`
- local database/media data

These are covered by `.gitignore`.

## Licence

MIT. See [`LICENSE`](LICENSE).

## Release notes — v1.80.1

v1.80.1 is the GitHub-ready v1.80 release. It fixes the generic Cloudflare R2 binding so the public repository configuration remains syntactically valid for Wrangler CI. It otherwise consolidates the v1.76 development series into a GitHub-ready release. It includes the Home dashboard, current ChurchSuite sync/template workflows, Song Library comparison and reconciliation, SongSelect guided/file/browser import paths, side-by-side song merge with critical CCLI mismatch warnings, responsive UI refinements, and the self-hostable Edge/Chrome extension Options page.

For older development notes and audits, see the files under [`docs/`](docs/).
