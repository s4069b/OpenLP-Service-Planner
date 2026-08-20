# OpenLP Service Planner v1.76.59 — Consistency and Security Audit

Scope: browser/runtime consistency, collaboration revision protection, service creation/deletion helpers, activity logging, client/server identifier integrity, authentication/authorization controls, uploads/media rendering, PDF parsing, backups/restores, migration integrity, Debian/VPS syntax, repository secret hygiene, and direct dependency advisory review.

## Fixed in v1.76.59

- Restored the missing `appendAudit()` browser helper. Numerous ordinary service/song/theme/ChurchSuite actions referenced it and could otherwise throw after completing their main action.
- Restored missing shared-service helpers: `createRemoteService()`, `deleteRemoteService()`, `deleteRemoteServices()`, and `removeServicesAfterConfirmedDelete()`.
- New service creation now waits for the shared save. If the remote creation fails, the temporary local service is rolled back instead of leaving a phantom local-only service.
- Existing complete-service writes now use revision-checked replacement. The generic service POST endpoint is creation-only and rejects an existing ID, closing a path that could bypass collaboration conflict protection.
- `PUT /api/services/:id` now forces the persisted service ID to the URL ID. A request can no longer claim one service's revision while supplying another service ID in the JSON body.
- `PUT /api/services/:serviceId/items/:itemId` now forces the persisted item ID to the URL item ID.
- Added regression checks for all restored browser helpers and the service/item URL-ID binding rules.
- Added a `check:project` npm alias pointing at the real browser/quality check so release instructions and package scripts agree.
- Advanced browser asset cache-busting from the stale `v=17642` token to `v=17659`, preventing old JS/CSS from being reused after this deploy.
- PDF.js loading is explicitly configured with scripting and XFA disabled as defence in depth. The pinned `pdfjs-dist` 6.2.108 is also the patched version for the July 2026 PDF.js scripting advisory.

## Checks passed

- `npm run check:project`
- `npm run check:vps`
- `npm run test:migrations` — all 21 migrations
- `node --check public/app.js`
- source scan for accidentally committed live secrets: no matches
- native browser dialog check: none
- CSP check: inline scripts blocked
- Debian auth/recovery environment parity check

## Security controls confirmed

- API access requires an authenticated Planner user.
- Unsafe authenticated requests require same-origin Origin/Referer/Sec-Fetch-Site evidence.
- Administrator-only server enforcement remains in place for settings, user/admin operations, backup/restore, seed operations, statistics deletion and activity-history deletion.
- Session cookies use the `__Host-` prefix with Secure, HttpOnly and SameSite=Lax.
- Security headers include CSP, frame denial, nosniff, HSTS, referrer policy and a restrictive permissions policy.
- Uploaded active content is not rendered inline; inline media is limited to supported images/video/PDF.
- `.gitignore` excludes local secrets, Wrangler state, generated Worker types and local data.

## Remaining limitations / follow-up

- This ZIP has no `package-lock.json`, so a complete reproducible `npm audit` of transitive dependencies cannot be performed. Direct dependencies are pinned, but a lockfile should still be committed on the normal development machine.
- Full Cloudflare TypeScript validation cannot complete from this ZIP because `worker-configuration.d.ts` is generated and intentionally absent. Run `npm run types && npm run check:cloudflare` in the normal Wrangler development environment.
- Local passwords still use PBKDF2-HMAC-SHA256 at 100,000 iterations; benchmark Cloudflare/VPS cost before raising this.
- Application-level IP rate limiting is not implemented; Cloudflare/reverse-proxy rate limits remain advisable for public login/recovery endpoints.
- Full-backup restore is Administrator-only and has a 32 MB metadata cap, but decompressed media is streamed according to the manifest rather than a separate global decompressed-size ceiling. This is a lower-priority resource-exhaustion hardening opportunity.
