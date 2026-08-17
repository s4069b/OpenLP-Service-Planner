# Publishing this as a new GitHub repository

1. Run `npm install` locally. Confirm it succeeds and creates `package-lock.json`.
2. Run `npm run validate` and resolve any failure.
3. Confirm `wrangler.toml` contains your intended D1 ID. For a public template repository, leave the placeholder and configure the deployment after cloning.
4. Search the tree for passwords, client secrets, tokens, personal email addresses and production database/account IDs.
5. Choose a licence and add `LICENSE` if you want others to have explicit rights to use/modify/distribute the project.
6. Create an empty GitHub repository (do not initialise it with a README if using this folder).
7. From this folder run:

```bash
git init
git add .
git status
git commit -m "OpenLP Service Planner v1.74"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

8. In GitHub, enable Dependabot/security features you want and consider enabling **Private vulnerability reporting**.
9. If this is the production repository, store deployment secrets in Cloudflare/VPS configuration—not GitHub source files.
10. Tag the baseline release if desired:

```bash
git tag -a v1.74 -m "OpenLP Service Planner v1.74"
git push origin v1.74
```
