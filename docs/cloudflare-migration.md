# Cloudflare migration architecture decision

Status: implemented and deployed to `me.moesegfault.dev` on 2026-09-29; see `cloudflare-validation.md` for local, preview, and production evidence. Scope: this hostname only.

## Decision

Keep Astro's current `output: "static"` build and deploy its `dist/` output together with one small TypeScript Cloudflare Worker. The Worker owns only same-origin `/api/*` requests, initially `GET /api/github/profile`; Cloudflare Static Assets owns all published HTML, images, CSS, JS, `llms.txt`, sitemap, and the custom 404 page. Do **not** introduce the Astro Cloudflare adapter, a database, or server-side rendering merely to add this endpoint. Astro and Cloudflare both document static Astro deployment without an adapter, while Workers Static Assets explicitly supports an SSG site alongside a Worker API. [Astro deployment guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Astro adapter guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [Cloudflare SSG routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/).

This is a full-stack TypeScript deployment, but not a request-time-rendered site. That distinction is deliberate: the site's content and SEO should not depend on a GitHub request at page-view time.

## Existing contracts and ownership

| Surface | Current owner and state | Migration invariant |
| --- | --- | --- |
| `/`, `/uses/`, `/now/`, `/projects/`, `/contact/` and `/en/` counterparts | Astro prerender, ten `index.html` files | Preserve paths, trailing slash canonical URLs, localized HTML, alternate links, metadata, and sitemap. |
| `/llms.txt`, `robots.txt`, sitemap files, `404.html` | Astro/static output | Preserve static response bodies and content types; unknown paths return the custom 404 with status 404, not SPA index. |
| Home GitHub profile | `src/lib/github-profile.ts` fetches at build; failure aborts build. `src/components/GitHubProfileCard.astro` embeds a valid snapshot. Browser refresh is optional. | A successful deployment always includes valid static profile HTML. Dynamic refresh may update it, but must never erase or block it. |
| Project catalog | `src/lib/github.ts` fetches at build and uses `PROJECT_FALLBACK` on failure. `src/lib/project-catalog.ts` shares one request per build. | Preserve source/fallback semantics and static project cards; no need for a runtime projects API now. |
| Canonical domain | `astro.config.mjs` and discovery verifier use `https://me.moesegfault.dev` | Keep domain and `site` value; cut DNS only after Worker preview passes. |
| Deployment | `.github/workflows/deploy.yml` uses GitHub Pages and CI `GITHUB_TOKEN` | Keep CI token build-only. Use separate Cloudflare deployment credentials; a runtime GitHub credential, if provisioned, is a distinct Worker secret. |

The public page routes are the compatibility boundary, not GitHub's raw REST JSON format or today's browser script implementation. The normalized `GitHubProfile` shape in `src/lib/github-profile-model.ts` is the useful internal contract. For this migration, the Worker maps that validated model back to a **narrow GitHub REST-compatible projection** (`login`, `avatar_url`, `html_url`, `public_repos`, etc.) because the existing browser parser already understands it. This is intentionally not an unfiltered upstream proxy: its exported fields are fixed by `PublicProfilePayload`. A later versioned normalized API would be reasonable only if another consumer appears or the browser model changes. The same-origin Worker API is the primary refresh path. A narrowly triggered browser-to-GitHub fallback remains temporarily for the observed anonymous Worker rate-limit case; neither path may expose a GitHub token to the browser.

## Request and failure model

```text
GET /projects/ or /en/   -> Cloudflare Static Assets -> prerendered HTML
GET /api/github/profile -> Worker -> edge cache -> fixed GitHub /users/kleedaisuki
                                      |              (only on cache miss)
                                      +-> validated, narrow public JSON
Worker 429              -> browser attempts one direct public GitHub refresh
either refresh fails    -> existing embedded profile stays visible
unknown page             -> Static Assets 404.html, status 404
unknown /api/*           -> Worker JSON 404, never an HTML success
```

The Worker should accept only `GET` on one exact pathname, reject other API paths, and build its upstream URL from a constant rather than user-controlled input. Validate the upstream payload with the existing `parseGitHubProfile` mapping, then return only the fixed `PublicProfilePayload` fields in the legacy parser's GitHub-compatible spelling. Do not proxy upstream headers, error bodies, credentials, or arbitrary GitHub URLs. The browser should validate the response, pre-load a changed avatar as it does now, and only then replace displayed fields. The **only** exception to the same-origin refresh path is a Worker `429`: make at most one unauthenticated direct request to the fixed public GitHub profile endpoint, preserving the previous enhancement behavior. On any other Worker failure, or if the direct fallback also fails, retain the HTML snapshot and report the existing static state. Keep the 5-minute session cache as a client-side optimization unless tests motivate removing it.

Prefer a short edge-cache TTL (initially five minutes) for the one public, identical response, with cache key fixed to the canonical API path. Cloudflare's Cache API is data-center-local, so a miss may still occur at another edge location; do not promise globally synchronized freshness. Do not cache upstream failures as successful profile data. `ctx.waitUntil(cache.put(...))` may avoid delaying the response after successful validation; cache behavior must be exercised under `wrangler dev` and in a preview. Cloudflare's Cache API does **not** implement `stale-while-revalidate`/`stale-if-error`, so the embedded HTML is the reliable outage fallback rather than an assumed stale edge object. [Cloudflare Cache API](https://developers.cloudflare.com/workers/runtime-apis/cache/).

GitHub documents a low unauthenticated REST quota (60 requests/hour by origin IP) and a higher authenticated quota, with secondary rate limits as well. **Observed in the 2026-09-29 remote preview:** static routes worked, but the Worker API returned `429` when fetching GitHub anonymously from Cloudflare egress. That invalidates the earlier assumption that anonymous Worker access would suffice for initial traffic. The one-shot browser fallback preserves the previous dynamic enhancement for clients whose own public GitHub access still works; it is not a reliable substitute for a server credential, especially where GitHub is unreachable from the client. Prefer provisioning a distinct, least-privilege Worker GitHub secret before relying on the API for freshness. The GitHub Actions `GITHUB_TOKEN` is for CI and must not be copied into deployed client code or assumed available in the Worker. In either mode, emit bounded errors and avoid automatic retry storms. Conditional requests using ETags can be added **after measurement** if quota remains a problem; a local edge cache plus static fallback is the simpler first design. [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [GitHub API best practices](https://docs.github.com/rest/guides/best-practices-for-integrators), [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Wrangler and runtime boundary

The intended configuration shape is:

```jsonc
{
  "main": "src/worker.ts",
  "compatibility_date": "2026-09-29",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash",
    "run_worker_first": ["/api/*"]
  }
}
```

`run_worker_first` matters despite the API path not matching a static file: with a configured custom 404 and modern compatibility date, Cloudflare routes **navigation** requests to asset handling by default, so typing an API URL into a browser can otherwise return an HTML 404 rather than the JSON endpoint. Restricting Worker-first to `/api/*` keeps ordinary page and asset delivery off the billed Worker path. `auto-trailing-slash` matches Astro's `folder/index.html` output; `404-page` preserves real 404 semantics. [Cloudflare SSG routing and navigation behavior](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/), [Cloudflare HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/), [Cloudflare Worker-first routing](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/).

The Worker should remain platform-standard Fetch API code with explicit binding types. Do not add `nodejs_compat` just for this endpoint. If the Worker sees a non-API request due to unusual platform routing, delegate to `env.ASSETS.fetch(request)` rather than duplicating the static router. Keep build-time `process.env.GITHUB_TOKEN` in Astro's Node build; runtime secrets arrive via the Worker's `env` binding. Cloudflare recommends CI deployment using a narrowly scoped `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, stored as GitHub Actions secrets. [Cloudflare Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Cloudflare GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

## Alternatives and why not

| Option | Benefit | Reason rejected now |
| --- | --- | --- |
| Pure static assets, leave browser talking directly to GitHub | Minimal deployment change | Does not move the data boundary to Cloudflare; browser rate limits and cross-origin availability remain, and the requested TypeScript backend would not exist. |
| Astro Cloudflare adapter, `output: "static"` plus on-demand API route | One framework routing model, easy route colocation | Requires adapter-generated Worker and moves prerender execution toward `workerd` by default. Existing Node build-time GitHub credential flow then needs deliberate compatibility handling. Too much coupling for one endpoint. Reconsider if several real SSR routes or Astro actions appear. [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/). |
| Make all pages SSR | Fresher server-rendered profile/projects | Adds GitHub/runtime latency and failure to every content visit, degrades the static contract, and creates unnecessary cache complexity. |
| D1, KV, Durable Object, cron snapshot service | Centralized persistent data and refresh | No product state requiring it; build snapshot and local edge cache already satisfy current availability and freshness needs. Add only after a measured use case. |

The architectural mechanism is to keep the *stable document* and *fresh enhancement* separate. This matches the established site's user-facing behavior and avoids coupling page tail latency to GitHub's tail latency. Dean and Barroso's peer-reviewed discussion of tail latency supports treating remote dependencies as a user-visible risk, but it does not by itself prove an optimal cache TTL or require sophisticated hedged requests for this one-profile site. [Dean and Barroso, *The Tail at Scale*, CACM 2013](https://research.google/pubs/the-tail-at-scale/).

### Academic frontier: edge placement versus a one-profile site

Recent peer-reviewed work studies **cross-edge function placement and probabilistic container caching** under bursty requests, heterogeneous edge resources, and cold-start costs; its reported gains concern provider-level scheduling and *function-container* reuse, not caching a tiny public JSON response. The direction is relevant if this site grows into many latency-sensitive, data-heavy functions, but those assumptions do not hold for one infrequently updated GitHub profile. Cloudflare already owns function placement, and this application has no measured cross-region bottleneck to optimize. Therefore start with static HTML plus a simple response cache, not bespoke placement, KV replication, or adaptive cache policy. Revisit only if production traces show significant API p95/p99 latency, cold-start impact, or GitHub quota pressure; then compare against the present design on the same traffic. [Chen et al., *Cross-Edge Orchestration of Serverless Functions With Probabilistic Caching*, IEEE Transactions on Services Computing 17(5), 2024](https://www.repository.cam.ac.uk/items/024ee463-8904-424e-be28-cfe99a31d05e).

## Migration slices and release gate

1. Freeze the current public contract: run unit, discovery, and browser tests; enumerate route status, canonical URL, alternate links, sitemap, 404, profile snapshot, and project fallback. Record artifacts under repository `.cache/` or `.temp/` only.
2. Add `src/worker.ts`, a focused API contract test, and Wrangler config. Keep Astro static. Introduce the Worker API behind the preview hostname; build and deploy assets plus code in one release. Validate both `fetch('/api/github/profile')` and direct browser navigation to the API path.
3. Change the browser refresh endpoint to the same-origin API, with the one-shot public GitHub fallback **only** for Worker `429`; preserve the existing static/error state machine. Verify no secret or token appears in `dist/`, Worker response, or browser network requests. Test `429` followed by both direct-GitHub success and direct-GitHub failure.
4. Switch CI deployment from GitHub Pages to Cloudflare only after all checks pass. Use least-privilege Cloudflare credentials, publish preview first, verify all ten routes plus `llms.txt`, sitemap, 404, and API under Cloudflare routing, then attach `me.moesegfault.dev`. Do not remove the old deployment before the new domain serves the validated artifact. Roll back by reverting the domain/route to the prior Pages deployment or redeploying the last known-good Worker version.
5. Watch API error/rate-limit counts and edge-cache hit behavior after cutover. Preserve the build failure signal for profile fetch and a visible warning for project fallback. If the profile API fails, the public site should remain usable without emergency rollback; if HTML route or SEO contracts fail, roll back promptly.

The custom-domain permission and DNS cutover were resolved by the local authenticated deployment recorded in `cloudflare-validation.md`. GitHub Actions' separate repository API token has not yet been exercised by CI. Anonymous GitHub egress has already produced a `429` in preview, so measure API cache misses and 403/429 responses while arranging a runtime credential; do not treat one successful production request as evidence that the limit is gone.
