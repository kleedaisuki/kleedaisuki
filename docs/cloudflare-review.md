# Cloudflare migration independent review

Date: 2026-09-29. Scope: the uncommitted Cloudflare migration, especially `src/worker.ts`, `wrangler.jsonc`, `.github/workflows/deploy.yml`, the browser profile refresh, route tests, and migration/validation notes. This is a code and release-readiness review, not a claim that the production hostname or GitHub Actions secrets were independently exercised.

## Assessment

No demonstrated correctness or security defect was found in the changed application code. The small Worker has a fixed upstream URL, a narrow validated response, no browser-exposed credential, bounded timeout, non-cacheable errors, and a static HTML fallback. The Worker-first `/api/*` rule and static-assets 404 settings match [Cloudflare's current routing documentation](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/). The preview evidence in `docs/cloudflare-validation.md` is stronger than a local-only test, but does not settle production DNS and credential behavior.

## Release finding: dynamic profile freshness depends on a separate Worker credential

**Priority: P2, operational/conditional; confidence: high in the dependency, medium in expected production frequency.** `src/worker.ts` calls GitHub anonymously when `env.GITHUB_TOKEN` is absent, whereas `.github/workflows/deploy.yml` supplies `GITHUB_TOKEN` only to the Astro build step. The user-reported Cloudflare preview already returned `429` for the live endpoint before later returning `200` (`docs/cloudflare-validation.md`, "Remote Cloudflare preview smoke test"). Thus configuring `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in GitHub Actions does **not** solve the Worker-to-GitHub quota problem. GitHub's [REST rate-limit documentation](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) distinguishes anonymous and authenticated limits; Cloudflare [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/) are runtime bindings, separate from CI environment variables.

**Impact:** static profile HTML remains usable and the browser tries its old direct GitHub path only after a Worker `429`, so this is not a site-availability blocker. But visitors unable to reach GitHub directly—material for an audience in mainland China—may see a stale build snapshot indefinitely despite a successful Cloudflare deployment. A cold edge also has no stale Cache API response to serve after a `429`.

**Correction/decision:** before claiming a reliable same-origin live API, provision a distinct least-privilege `GITHUB_TOKEN` secret on the production Worker and test `/api/github/profile` at the custom domain, including after a cache miss. Otherwise explicitly accept and monitor snapshot-only operation. Do not pass the CI `GITHUB_TOKEN` into the client build or confuse it with this Worker binding. No code change is necessary if snapshot-only behavior is accepted.

## Cutover gate, not an implementation defect

`wrangler.jsonc` declares `me.moesegfault.dev` as a Worker Custom Domain. [Cloudflare documents](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) that Custom Domain creation cannot proceed while the hostname has an existing CNAME. Therefore GitHub Actions secrets alone are insufficient to complete cutover: remove the old DNS CNAME, then run the authorized deploy and verify the custom hostname. The repository's deletion of `public/CNAME` only removes a deployed file; it cannot alter Cloudflare DNS. This is already called out in `README.md` and `docs/cloudflare-migration.md`, so it is a release gate rather than a new code finding.

## Review limits

I inspected the changed files and their relevant callers/tests, plus current Cloudflare and GitHub official documentation. I did not modify production code, repeat already-reported green tests, view secret values, change DNS, or deploy the production hostname. The local tests stub cache and GitHub fetch; the remote preview checks routing but is not a production-zone test.

## Post-review resolution by the project lead

The old DNS CNAME was subsequently removed and Worker version `8a8c9a91-a045-4141-83b3-60f96210eac8` was deployed to `me.moesegfault.dev`; production route and API checks are recorded in `cloudflare-validation.md`. Thus the custom-domain cutover gate is resolved. The optional runtime GitHub credential remains unset and the conditional freshness risk remains open, with the static snapshot and direct-browser compatibility path as graceful degradation.
