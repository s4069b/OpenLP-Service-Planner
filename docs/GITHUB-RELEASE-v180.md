# Releasing v1.80.0 on GitHub

## Recommended first public release

1. Upload/push the complete repository contents.
2. Confirm GitHub Actions **Build and portability checks** passes.
3. Create a tag:
   ```bash
   git tag -a v1.80.0 -m "OpenLP Service Planner v1.80.0"
   git push origin v1.80.0
   ```
4. Create a GitHub Release from tag `v1.80.0`.
5. Attach the repository/source ZIP only if you want an additional downloadable archive; GitHub already creates source archives automatically.

## Before deploying a fork

Edit `wrangler.toml` with your own D1 database ID and R2 bucket name. Add deployment secrets outside Git. The SongSelect extension can be pointed at the fork's deployed Planner from its Extension Options page.

## Do not commit

`.dev.vars`, `.env*`, local data, generated build output or dependency folders.
