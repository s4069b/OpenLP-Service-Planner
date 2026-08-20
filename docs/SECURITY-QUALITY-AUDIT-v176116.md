# Security and quality audit — v1.76.116

## Scope

This pass covered browser JavaScript, server JavaScript modules, Cloudflare Worker routing/security structure, migrations, static assets, and the packaged SongSelect Edge/Chrome extension.

## Cleanup completed

- Removed the obsolete SongSelect bookmarklet generator/setup UI.
- Removed the superseded SongSelect pre-merge update-review path.
- Removed bookmarklet compatibility from the Planner message receiver.
- No temporary ChurchSuite people diagnostics remain.
- No browser `console.log`, `console.debug`, `debugger`, TODO/FIXME, `eval`, or `new Function` use was found.
- CLI/server migration and smoke-test status logging remains intentionally.

## Security observations

- Worker API requests require an authenticated user before API routing.
- Unsafe requests are rejected unless same-origin.
- Administrator-only API paths remain protected by the server-side access-level gate.
- Security response headers include CSP, frame denial, nosniff, HSTS, referrer policy, and permissions policy.
- No hard-coded private-key or secret-like literals were found in the application/extension source scan.
- The SongSelect extension uses Manifest V3 and requests only `scripting`, `storage`, and the SongSelect/Planner site access needed for the bridge.
- Pending SongSelect payload data is removed from extension storage immediately after delivery, or discarded if stale.

## Validation completed

- `node --check public/app.js`
- syntax checks for server/scripts and all extension JavaScript
- project browser/quality checker
- VPS server syntax checker
- migration test: all 21 migrations pass
- extension manifest JSON parse/package integrity

## Validation limitation

The distributable source ZIP intentionally does not contain `node_modules`, a package lock, or generated `worker-configuration.d.ts`. Full `wrangler types` / TypeScript Cloudflare checking and the esbuild VPS bundle therefore cannot be reproduced from the ZIP alone without the normal dependency-install/type-generation step. Those commands remain in `package.json` for CI/development checkout validation.
