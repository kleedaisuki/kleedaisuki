# Cloudflare deployment runbook

The repository-root `README.md` belongs to the user and is **not** the site's content source. The public Chinese home-page profile lives in `src/content/profile/zh.md`; do not couple it to README again. This runbook owns maintainer-facing operational instructions; see [migration architecture](cloudflare-migration.md) and [validation evidence](cloudflare-validation.md) for design and release history.

## Current deployment

Astro prerenders the public pages to `dist/`. Cloudflare Static Assets serves those files, while the TypeScript Worker in `src/worker.ts` handles `/api/github/profile`. The canonical hostname `me.moesegfault.dev` was attached to the Worker on 2026-09-29. The original GitHub Pages `public/CNAME` file was removed; DNS is managed by Cloudflare and is not configured by a file in this repository.

## Local verification

Use Node.js 24 and the repository's pnpm version. If a local `pnpm` shim is broken, use `corepack pnpm` in its place. Keep test artifacts under repository-root `.cache/` or `.temp/`.

```sh
pnpm install --frozen-lockfile
pnpm cf-typegen
pnpm check
pnpm test:unit
pnpm build
pnpm verify:discovery
pnpm preview:cloudflare --port 4341
```

`pnpm dev` serves Astro for UI work, but it does not exercise Cloudflare's API and asset routing. Use the Wrangler preview to check the same-origin API and custom 404. `pnpm exec wrangler deploy --dry-run` bundles and validates deployment configuration without publishing it. Run `pnpm cf-typegen` after a binding change and commit the updated `worker-configuration.d.ts`.

## Continuous deployment and credentials

A push to `main` or a manual trigger runs `.github/workflows/deploy.yml`. It checks generated bindings and TypeScript, runs unit tests, builds and verifies discovery files, runs Chromium routing tests, then deploys the Worker and assets. The first push-triggered deployment [succeeded](https://github.com/kleedaisuki/kleedaisuki/actions/runs/36585766027).

Provide `CLOUDFLARE_ACCOUNT_ID` and a narrowly scoped `CLOUDFLARE_API_TOKEN` as GitHub Actions repository or `production` environment secrets. The token needs the permissions required to deploy this Worker; changing its custom-domain connection additionally needs Workers Routes Write on the zone. Keep deployment tokens out of the repository. Configure required reviewers on the `production` environment if a manual approval gate is desired.

The Actions build's `GITHUB_TOKEN` only supplies build-time GitHub data. It is **not** a Worker runtime secret. Anonymous Worker egress has intermittently received GitHub `429` responses. For more reliable live profile refresh, provision a separate, least-privilege runtime credential using `pnpm exec wrangler secret put GITHUB_TOKEN`. Without it, static profile HTML remains available and the browser has a rate-limit-only direct-GitHub fallback. Do not paste a token into source, config, logs, or issue comments.

## Rollback

If page routing or SEO contracts fail, redeploy the last known-good Worker version. A return to GitHub Pages requires restoring its deployment workflow and DNS routing from the earlier Git history; restoring `public/CNAME` alone does not alter Cloudflare DNS. Verify all ten localized routes, `llms.txt`, sitemap, API status, and a genuine `404` after any routing change.
