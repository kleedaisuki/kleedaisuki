# Cloudflare migration validation

## Scope and expected contracts

The pre-migration site is a static Astro 7 site. Its public contract includes five Chinese routes (`/`, `/uses/`, `/now/`, `/projects/`, `/contact/`) and five corresponding `/en/` routes, a localized 404 page, `llms.txt`, `robots.txt`, and a sitemap index. Existing Playwright checks cover HTML language, navigation, responsive layout, theme persistence, and the GitHub card's static fallback. These were inferred from `src/pages`, `tests/e2e/site.spec.ts`, and `scripts/verify-discovery.mjs`, not from the Cloudflare implementation.

For this migration, the browser's live GitHub card should request same-origin `GET /api/github/profile` instead of GitHub REST directly. The Cloudflare Worker should serve static assets without altering the established routes. The profile endpoint should return GitHub REST-compatible JSON on success, reject non-GET with `405` and `Allow: GET`, return JSON `404` for unknown `/api/*`, preserve the build-time profile when live refresh fails, and map upstream rate limits to `429` and other unavailable/invalid responses to `503` without caching failures. The `405` and `404` checks are deterministic; upstream cases need isolated Worker tests or controlled fetch injection to avoid depending on public GitHub's current state.

## Baseline before migration

Environment: Windows PowerShell, Node v26.8.2, local `node_modules`; date 2026-09-29. The system `pnpm.ps1` shim pointed to a missing global pnpm executable, so baseline commands used project-local `.CMD` executables and `node`:

```powershell
& .\node_modules\.bin\astro.CMD check
node --test --experimental-strip-types tests/*.test.ts
& .\node_modules\.bin\astro.CMD build
node scripts/verify-discovery.mjs dist
```

Observed: Astro check returned 0 errors, warnings, or hints across 47 files; all 4 unit tests passed; static build completed and generated the expected localized pages, `llms.txt`, and sitemap. `verify-discovery` initially failed at `scripts/verify-discovery.mjs:204` because it required `https://blog.moesegfault.dev`, while the current site's `SITE.blogUrl` and E2E expectation use `https://atelier.moesegfault.dev`. This was a pre-existing assertion/content mismatch, not evidence of a Cloudflare regression. The exact verifier message was `/ must link to https://blog.moesegfault.dev`. Updating the two stale test expectations to Atelier made the verifier pass: `Verified 10 localized routes and discovery artifacts`.

## Migration checks

The Playwright web server should run the Cloudflare Wrangler preview, not Astro's static preview, so route and API behavior are exercised through the deployment runtime. Run a focused browser pass first:

```powershell
corepack pnpm exec playwright test --project=chromium
```

Playwright fixtures are stored under repository-root `.cache/playwright`. The `site.spec.ts` browser mock now intercepts the same-origin endpoint, and the live-upgrade test asserts the first request origin matches the page origin; the second localized page is allowed to use the existing five-minute browser session cache. The API test checks deterministic `405` and JSON `404` behavior.

With `wrangler dev` serving the built site, the first Chromium run passed 18 of 19 E2E tests. The only failure was a new test-harness mistake: it expected a second network request on `/en/`, but the valid profile was already cached in the same browser session. The profile was live, so this was not a product defect. After correcting that assertion, the exact failed test passed on a focused rerun. A final full Chromium run after the Worker switched to a named edge cache passed **19/19** E2E tests in 24.3 seconds.

`tests/worker.test.ts` uses stubbed GitHub fetch, edge cache, static-assets binding, and execution context. This keeps external GitHub and network timing out of the expected result. All five Worker tests passed, and the full unit suite passed **9/9** under `node --test --experimental-strip-types tests/*.test.ts`: successful profile response contains only the browser-required public fields and is reused from cache; upstream `403` and `429` become non-cacheable `429` responses; malformed upstream JSON becomes non-cacheable `503`; unknown API routes return JSON `404`; unsupported methods return `405` with `Allow: GET`; non-API paths delegate to assets. Astro check returned 0 errors, warnings, and hints across 50 files. Biome passed for all modified test/config files. The static fallback when browser refresh or avatar preload fails passed in the Wrangler-backed Chromium run.

Coverage limits: the tests do not prove Cloudflare production deployment, edge-location cache behavior, secret injection, real GitHub rate-limit behavior, or behavior on every browser/device. Production smoke tests should check one route per locale, `/api/github/profile`, an unknown `/api/*` path, and the sitemap at the deployed custom domain.

CI can set `PLAYWRIGHT_SKIP_BUILD=1` after its verified `build` and `verify:discovery` steps. In that mode Playwright starts only `wrangler dev`, avoiding a duplicate GitHub snapshot request. A focused Chromium API test passed with the flag, and the web-server log showed no additional Astro build. Without the flag, local Playwright still performs a build before starting Wrangler.

## Remote preview finding and compatibility fallback

The project lead reported that the remote Cloudflare preview's real `GET /api/github/profile` returned `429`, consistent with the shared anonymous GitHub API quota. This is a remote-preview observation reported by the lead, not reproduced by the stubbed local tests; a provisioned `GITHUB_TOKEN` and production edge cache may change its frequency. Because the former browser enhancement fetched GitHub directly, a Worker-only `429` would silently reduce functionality for visitors even though the static snapshot still renders.

The browser now tries the original public GitHub REST endpoint **only after** a Worker `429`. Two focused Wrangler-backed Chromium tests passed: mocked Worker `429` plus direct GitHub `200` yields a live card with the expected profile and exactly one direct request; mocked Worker `200` yields a live card with zero cross-origin GitHub REST requests. Command:

```powershell
corepack pnpm exec playwright test --project=chromium -g "rate limited|cross-origin GitHub REST"
```

Observed: **2/2 passed**. These deterministic tests verify browser compatibility behavior, not the remote edge's actual cache or quota. If both sources are unavailable, the existing static-card fallback remains the intended outcome.

## Remote Cloudflare preview smoke test

On 2026-09-29, the production-like artifact was deployed to the separate Worker `me-moesegfault-dev-preview` at `https://me-moesegfault-dev-preview.moesegfault.workers.dev` using the temporary configuration in `.temp/wrangler-preview.jsonc`. This Worker has no route for `me.moesegfault.dev`, so it did not alter production DNS or traffic. The latest preview version observed was `150b1aac-2676-4257-a65d-dda97b7db867`. The request/status record is `.temp/remote-smoke.json` (local, intentionally ignored by Git).

An HTTP smoke pass requested all ten localized page paths plus `llms.txt`, `robots.txt`, and `sitemap-index.xml`: all thirteen returned `200` with appropriate HTML, plain text, or XML content types. The removed GitHub Pages `/CNAME`, an unknown page, and unknown `/api/*` path all returned `404`; the unknown API response was JSON. The actual `/api/github/profile` returned validated JSON with `200` on the final pass. An earlier request to the same endpoint had returned `429`, motivating the rate-limit-only browser compatibility fallback; this shows that one successful request is not proof that anonymous GitHub quota is consistently available. The first immediate `llms.txt` probe after the initial upload also returned a transient `404`, then repeated requests and the final all-route pass returned `200`; this may have reflected propagation and should be checked again after any production cutover.

This preview confirms Cloudflare's hosted routing and assets for the current artifact, but it does not verify the custom-domain attachment, zone-specific behavior, CI secrets, or production request distribution. Those remain release checks after the old GitHub Pages CNAME is removed.

## Cross-browser regression on the final preview build

With `PLAYWRIGHT_SKIP_BUILD=1` and the Wrangler local preview, the full 147-case matrix finished with **126 passes and 21 Firefox launch failures**. Every Chromium, WebKit, mobile Chrome/Safari, and WeChat-like emulation case passed, including the new rate-limit fallback. All 21 Firefox cases failed before page navigation at `browserType.launch: spawn UNKNOWN` when Windows attempted to start the installed Playwright Firefox executable (`firefox-1538`); there is no Firefox page assertion failure to attribute to site code. The failure is an environment/browser-launch limitation on this host, not a verified browser compatibility result. CI intentionally uses Chromium; a Firefox run on a healthy host remains useful before claiming Firefox parity.

## Production cutover verification

After the old GitHub Pages DNS CNAME was removed, `wrangler deploy` attached Worker version `8a8c9a91-a045-4141-83b3-60f96210eac8` to the Custom Domain `me.moesegfault.dev` on 2026-09-29. The first two local attempts failed before upload because this machine's configured HTTP proxy could not reach Cloudflare's API; a direct `wrangler whoami` succeeded, and clearing `HTTP_PROXY`, `HTTPS_PROXY`, and `ALL_PROXY` for the deployment process allowed a clean deploy. This was a local transport issue, not a Worker build error.

Cloudflare DNS-over-HTTPS resolved the hostname to Cloudflare A records after cutover. The local Windows resolver temporarily retained an NXDOMAIN result, so the production HTTP smoke check used `curl --noproxy '*' --resolve me.moesegfault.dev:443:172.67.129.129` to target a verified Cloudflare address while retaining the production SNI/Host. All ten localized routes plus `llms.txt`, `robots.txt`, and `sitemap-index.xml` returned `200`. `/CNAME`, an unknown page, and unknown API path returned `404`. The real profile API returned `200 application/json` with `Cache-Control: public, max-age=300`; its 12-field body did not include upstream-only `private_repos`. The custom 404 returned the bilingual not-found HTML with status `404`. An initial system-proxy pass had intermittent TLS/timeouts despite some successes; the direct, fixed-IP pass completed without those transport errors.

The Worker currently has no runtime `GITHUB_TOKEN` secret (`wrangler secret list` returned `[]`). A previous preview `429` proves that the successful production API probe does not guarantee anonymous quota at every edge location. The static profile and one-shot direct-browser fallback preserve usability; a least-privilege runtime token is recommended for reliable same-origin freshness. GitHub Actions CI deployment has not yet been exercised by a repository push in this record.

## Cloudflare asset discovery contract

After removal of `public/CNAME`, the discovery verifier still tried to read `dist/CNAME` and failed with `ENOENT`. That file is a GitHub Pages deployment convention, not a Cloudflare asset contract; Cloudflare's custom domain is configured in `wrangler.jsonc`. The verifier now checks that the built asset directory **does not** contain `CNAME`, while continuing to validate canonical URLs, `robots.txt`, `llms.txt`, and sitemap contents. Running `node scripts/verify-discovery.mjs dist` against the current build passed all 10 localized routes; Biome passed for the updated script. This checks the local build artifact, not the live domain's DNS configuration.
