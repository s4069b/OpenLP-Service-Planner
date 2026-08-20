# v1.80.1 GitHub CI correction

The original v1.80.0 GitHub-ready package used the literal R2 placeholder
`REPLACE_WITH_YOUR_R2_BUCKET_NAME` in `wrangler.toml`. Wrangler validates R2
bucket names while generating Cloudflare types, so that placeholder can cause
the GitHub Cloudflare portability job to fail even though the application and
VPS checks are sound.

v1.80.1 uses the valid generic bucket name `openlp-service-planner-media`.
Self-hosters can change that value to the name they created for their own R2 bucket.
The D1 database ID remains the syntactically valid all-zero placeholder and must
be replaced before a real Cloudflare deployment.
