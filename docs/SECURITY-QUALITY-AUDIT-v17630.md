# OpenLP Service Planner v1.76.30 — Security, Permissions and Consistency Audit

Scope: authentication, authorization, ChurchSuite optional-extension boundaries, destructive actions, service/song/media mutations, backup/restore, Debian VPS request handling, browser dialogs, dependency/repository hygiene, and cross-platform validation.

## Fixed in v1.76.30

### Permission and authorization fixes

- **Activity history deletion is Administrator-only.** Planners may still add/edit services and create normal activity records, but only an Administrator can permanently clear a service's audit history. The restriction is enforced server-side as well as in the UI.
- **ChurchSuite Settings probes are Administrator-only.** Connection status and service-name discovery are used only from Settings and no longer expose those operations to Planner-level users.
- **ChurchSuite Service-list-only users are read-only.** Level-1 users can view the published service list but cannot trigger its re-sync operation; re-sync remains available to Planner/Administrator users.
- **ChurchSuite Off is enforced server-side.** Planner-accessible plan listing and plan scanning endpoints reject requests while the extension is Off. Hiding the buttons is no longer the only control.

### ChurchSuite mode consistency fixes

- Level-1 post-login routing now recognises the current `on` mode as well as legacy `manual` / `auto` values.
- Published-plan availability uses the same shared server-side mode helper.
- A disabled `/churchsuite-plans` route returns a normal 404 response instead of falling through to static-asset handling.
- Stale user-management wording referring to "Automatic ChurchSuite" has been removed.

### Authentication hardening

- Local-login password input is capped at 1024 characters before PBKDF2 verification. New/reset local passwords use the same cap. This prevents pathological public login requests from forcing PBKDF2 work on arbitrarily large password strings.
- Existing controls remain in place: strong random server-side sessions, hashed session tokens, `__Host-` Secure/HttpOnly/SameSite cookies, account lockout, same-origin checks for unsafe requests, OIDC state/nonce, signature/issuer/audience/expiry validation, stable external identity linkage, and session invalidation after password reset/account disable.

### Debian VPS request hardening

- Ordinary POST/PUT/DELETE request bodies now default to a separate **10 MB** ceiling (`PLANNER_MAX_REQUEST_MB`).
- Large-body routes used for media and restore operations continue to use `PLANNER_MAX_UPLOAD_MB` (default 250 MB).
- This reduces the denial-of-service surface of public login and ordinary JSON/form endpoints without reducing normal media/restore capacity.

### Media response hardening

- User-uploaded media is only rendered inline for the passive types the Planner actually expects: JPEG/PNG/WebP/GIF images, MP4/WebM/QuickTime video, and PDF.
- Other stored content types are forced to download rather than being rendered inline under the Planner origin.
- Media filenames used in response headers now strip quotes and CR/LF characters.

### Repository hygiene

`.gitignore` again excludes:

- `node_modules/`
- `.dev.vars` and variants, while keeping `.dev.vars.example`
- `.env` files
- `.wrangler/`
- `worker-configuration.d.ts`
- local data, generated build output and logs

This is important before keeping the repository public.

## Positive controls confirmed

- No native browser `alert()`, `confirm()` or `prompt()` calls remain in the Planner UI.
- A source scan found no embedded live API/client/setup/recovery secrets; matches were placeholders, variable names or documentation examples.
- Content Security Policy blocks inline scripts and framing; security headers include `nosniff`, `DENY` framing, HSTS, referrer policy and a restrictive permissions policy.
- Unsafe authenticated API requests require a same-origin Origin/Referer/Sec-Fetch-Site signal.
- Database backup/restore rejects restores that would leave no usable Administrator.
- Full restore stages media under new keys before database cut-over and cleans normal failed restores.
- Authentication sessions and OIDC states are excluded from backups/restores.
- The 19 database migrations pass the SQLite migration/integrity test.
- Cloudflare and Debian use the same Worker application logic.

## Remaining hardening / limitations

### Medium — local password work factor

PBKDF2-HMAC-SHA256 remains at 100,000 iterations. This is below current OWASP guidance. Do not raise it blindly on Cloudflare: benchmark Worker CPU cost, then raise the cost and transparently rehash older hashes after successful login.

### Medium — no edge/IP login throttling

Account-level lockout exists, but the application itself has no per-IP/edge rate limit. Cloudflare deployments should consider a rate-limiting rule for `/auth/local`, `/auth/setup` and `/auth/admin-recovery`. A VPS reverse proxy can implement an equivalent limit.

### Medium — local Administrator MFA

Local Planner accounts do not have a second factor. Microsoft/My ChurchSuite SSO can rely on upstream identity-provider MFA policy. If local Administrator accounts remain a primary login path, passkeys/WebAuthn or TOTP would be a worthwhile future feature.

### Low/medium — session idle timeout

Sessions have a 12-hour absolute lifetime but no independent inactivity timeout or periodic session-ID rotation.

### Low — hand-written OIDC/JWT validation

The current validation checks the important token properties, but maintaining OIDC/JWT code in-project carries more long-term risk than using a maintained JOSE/OIDC library. Any replacement should be tested against both Microsoft and My ChurchSuite before changing production authentication.

### Release reproducibility — package lockfile missing

This source ZIP does not contain `package-lock.json`. Direct package versions are pinned, but transitive dependency resolution is therefore not reproducible. Generate and commit a lockfile on a network-connected development machine, then change CI from `npm install` to `npm ci`.

### Dependency audit limitation

A full `npm audit` could not be performed from this build environment because the npm registry was unavailable and there is no lockfile. The source-level audit therefore does not claim exhaustive transitive dependency coverage.

## Validation performed

Passed in this build environment:

- `node --check public/app.js`
- project quality/regression checks
- all 19 migration tests
- Debian/VPS source syntax checks

The complete Cloudflare TypeScript/dry-run validation still needs to be run on the normal development machine after `npm install`, because this release ZIP intentionally does not contain `node_modules` and currently lacks a lockfile.
