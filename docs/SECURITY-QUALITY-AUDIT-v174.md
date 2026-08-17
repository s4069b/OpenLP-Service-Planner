# OpenLP Service Planner v1.74 — Security and Quality Consolidation

v1.74 is a consolidation release focused on authentication safety, restore integrity,
consistent user interaction, Cloudflare/Debian portability, and repeatable validation.

## Completed in v1.74

### Consistent Planner dialogs

All native browser `alert()`, `confirm()` and `prompt()` calls in the shipped Planner UI
have been removed. Information, errors, confirmations, destructive actions and text-entry
prompts use the shared Planner-themed dialog component instead.

### Authentication and access safeguards

- A user login method only counts as usable when its provider is globally enabled and
  configured, not merely when the per-user checkbox is selected.
- Disabling a global SSO provider warns when enabled users would be left without a usable
  sign-in method.
- Settings changes are rejected server-side if they would leave the installation without
  an enabled Administrator who has a usable sign-in method.
- Restores are rejected if the restored user/settings combination would leave no usable
  Administrator under the destination installation's currently configured providers.
- SSO deletion messaging distinguishes account deletion from access revocation. Disable
  an account to prevent access; deleting an account can permit re-enrolment where the
  provider's self-enrolment policy allows it.
- Expired Planner sessions and OIDC state rows are opportunistically cleaned during
  authentication activity.

### Full-backup restore integrity

Full restore no longer overwrites live media before the database cut-over.

1. The incoming ZIP is streamed and validated.
2. Media is written under new staging keys.
3. The restored database is rewritten to reference those staged keys.
4. D1/SQLite data is replaced atomically.
5. Only after the database succeeds are the old media objects removed.
6. A failed restore cleans up staged media and leaves the existing database/media
   relationship intact.

Restored sessions and in-progress OIDC states are cleared so users authenticate afresh.
Backup files should be treated as confidential because they can contain church data,
user records, password hashes and media.

### Cloudflare and Debian VPS parity

- Debian now passes My ChurchSuite OIDC credentials, setup token and Administrator
  recovery token into the same Worker environment used by Cloudflare.
- The Debian request bridge streams request bodies rather than buffering the whole
  upload first.
- The filesystem R2 adapter streams large media to a temporary file and atomically
  renames it into place.
- `.mjs` static assets are served with the correct JavaScript MIME type.

### PDF.js and Content Security Policy

PDF.js is no longer loaded from jsDelivr at runtime. `pdfjs-dist` is an application
package and `npm install` copies the required browser files to `public/vendor/pdfjs/`.
This permits the Worker to keep `script-src 'self'`. Inline JavaScript used by the
ChurchSuite directory page and Run-sheet print button was also moved into application
scripts, allowing `unsafe-inline` to be removed from `script-src`.

### Dependency security updates

- `fflate` is upgraded to the current 0.8.3 release. The published advisory describes the
  denial-of-service issue as affecting versions through 0.8.2; the Planner also uses streaming
  `Unzip`, not the advisory's affected `unzipSync()` path.
- `esbuild` is upgraded to 0.28.2.
- Direct dependency versions are pinned in `package.json`; a full transitive lockfile still
  needs to be generated on a network-connected development machine.

### Validation

`npm run validate` now includes:

- browser JavaScript syntax checking plus a regression check that rejects native browser dialogs;
- Cloudflare type checking and dry-run deployment;
- all database migrations plus SQLite foreign-key/integrity checks;
- Debian/VPS syntax, bundle and smoke tests.

CI runs the browser and migration checks on both Cloudflare and VPS jobs.

## Deliberately not changed in v1.74

These are remaining hardening/maintenance items rather than known authentication bypasses.

- **CSS consolidation:** `public/app.css` has accumulated many historical overrides and
  `!important` rules. A wholesale rewrite in a security release would have a high visual
  regression risk. It should be consolidated incrementally with screenshot/visual tests.
- **Dependency lockfile:** this build environment could not reach npm to generate a
  trustworthy `package-lock.json`. Run `npm install` on a network-connected development
  machine and commit the generated lockfile; CI can then move to `npm ci`.
- **Local password cost:** existing PBKDF2-HMAC-SHA256 passwords use 100,000 iterations.
  Raising this should first be benchmarked against Cloudflare Worker CPU limits, then
  implemented with transparent rehash-on-login.
- **Local Administrator MFA:** local Planner accounts do not currently provide MFA.
  External SSO can supply MFA according to the identity provider's policy.
- **Session idle timeout:** sessions have an absolute expiry but no separate inactivity
  timeout. This can be added later without changing identity linkage.
- **OIDC library:** JWT/OIDC validation is implemented in-project rather than through a
  maintained JOSE package. Replacing it is desirable but should be done as a dedicated
  auth change with provider regression tests.
- **Platform upload ceilings:** a Cloudflare deployment cannot accept a restore request
  larger than the account/platform request-body limit. Streaming prevents Worker memory
  duplication but cannot bypass an upstream HTTP limit.
- **Abrupt-crash staging cleanup:** normal restore failures clean staged media. A process
  termination at exactly the wrong point can leave unreferenced staging objects; they do
  not become live data but a future maintenance job could remove old orphan staging keys.

## Recommended release validation

On a development machine with network access and the normal dependencies installed:

```bash
npm install
npm run validate
```

Then apply any pending D1 migrations and deploy using the normal Cloudflare or Debian
procedure. v1.74 itself adds no database migration beyond the existing 19 migrations.
