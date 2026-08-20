# v1.80.0 release audit

## GitHub readiness

- Package version set to `1.80.0`.
- Browser asset cache key set to `1800`.
- README replaced with current v1.80 deployment and feature documentation.
- MIT `LICENSE` added.
- Cloudflare `wrangler.toml` no longer contains the KPC production D1 database ID.
- SongSelect extension no longer defaults to the KPC Planner URL; a deployment URL must be set in Extension Options.
- `.gitignore` excludes secrets, dependencies, local data and generated build output.
- GitHub Actions checks remain present for Cloudflare and VPS portability.

## Validation completed in this packaging environment

- `npm run check:project` — pass
- `npm run check:vps` — pass
- `npm run test:migrations` — pass (21 migrations)
- SongSelect extension JavaScript syntax — pass
- Secret/deployment-specific identifier scan — pass
- Repository generated/secret-file hygiene scan — pass

## Validation limitation

`npm run check:cloudflare` could not complete in the packaging environment because the locally available `wrangler` executable is not executable (`Permission denied`). The repository GitHub Actions workflow installs dependencies on Ubuntu and runs the Cloudflare check/dry-run there. Confirm the **Build and portability checks** workflow is green after pushing v1.80.0.
