# Cloudflare installation

This is the recommended hosted deployment for OpenLP Service Planner.

## Requirements

- Node.js 24 or later
- npm
- A Cloudflare account with Workers, D1 and R2 available
- Wrangler authentication (`npx wrangler login`)
- A public HTTPS hostname (Workers.dev is sufficient; a custom domain is optional)

## 1. Install the source

```bash
git clone YOUR_REPOSITORY_URL
cd openlp-service-planner
npm install
```

`npm install` also copies the required PDF.js browser files into `public/vendor/pdfjs/`.

## 2. Create Cloudflare storage

```bash
npx wrangler d1 create openlp-service-planner
npx wrangler r2 bucket create openlp-service-planner-media
```

Copy the D1 database ID returned by Wrangler into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "openlp-service-planner"
database_id = "YOUR_D1_DATABASE_ID"
migrations_dir = "migrations"
```

The R2 binding should remain:

```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "openlp-service-planner-media"
```

Do not rename the `DB`, `MEDIA` or `ASSETS` bindings unless you also change the application code.

## 3. Configure authentication secrets

At least one way to establish an Administrator is required. For a fresh installation, the simplest provider-independent method is the one-time local setup token:

```bash
npx wrangler secret put PLANNER_SETUP_TOKEN
```

Enter a long random value. After deployment, visit `/setup`, create the first local Administrator, then remove the setup token:

```bash
npx wrangler secret delete PLANNER_SETUP_TOKEN
```

### Microsoft Entra ID SSO (optional)

Create an Entra application for the Planner and configure its redirect URI as:

```text
https://YOUR_PLANNER_HOST/auth/microsoft/callback
```

Set these values as Worker secrets/variables as appropriate:

```bash
npx wrangler secret put MICROSOFT_TENANT_ID
npx wrangler secret put MICROSOFT_CLIENT_ID
npx wrangler secret put MICROSOFT_CLIENT_SECRET
npx wrangler secret put MICROSOFT_ALLOWED_DOMAIN
```

`MICROSOFT_ALLOWED_DOMAIN` is the permitted email domain, for example `example.org`.

### My ChurchSuite OIDC sign-in (optional)

Register the Planner as a ChurchSuite OIDC application and use this callback:

```text
https://YOUR_PLANNER_HOST/auth/churchsuite/callback
```

Then set:

```bash
npx wrangler secret put CHURCHSUITE_OIDC_CLIENT_ID
npx wrangler secret put CHURCHSUITE_OIDC_CLIENT_SECRET
```

The application contains ChurchSuite's standard OIDC discovery location internally. My ChurchSuite sign-in can then be enabled/disabled by an Administrator in Planner Settings.

### ChurchSuite service-plan integration (optional)

This is separate from My ChurchSuite OIDC login. If you use the ChurchSuite API integration, configure:

```bash
npx wrangler secret put CHURCHSUITE_CLIENT_ID
npx wrangler secret put CHURCHSUITE_CLIENT_SECRET
```

Complete any ChurchSuite integration settings inside the Planner as required.

## 4. Validate and initialise D1

```bash
npm run validate
npm run db:remote
```

The second command applies all D1 migrations to the live database. Read the Wrangler prompt before confirming.

## 5. Deploy

```bash
npm run deploy
```

Open the deployed URL. If this is a fresh installation using `PLANNER_SETUP_TOKEN`, visit `/setup` first.

## Updating

Before an upgrade, download a **Full backup** from Planner Settings. Then update the source and run:

```bash
npm install
npm run validate
npm run db:remote
npm run deploy
```

Never delete or recreate the production D1 database or R2 bucket as part of a routine update.

## Backups

Use the Planner's Administrator-only **Full backup** for D1 plus media. Cloudflare D1 recovery can provide an additional database safety net, but it does not replace a backup of R2 media.

A single restore upload is also subject to your Cloudflare plan's HTTP request-size limit.
