import { SITE } from "./config/site.ts";
import { parseGitHubProfile, type GitHubProfile } from "./lib/github-profile-model.ts";

/** The only dynamic route; all site pages remain prerendered Astro assets. */
const PROFILE_PATH = "/api/github/profile";
/** Successful public profiles may be reused for five minutes at each edge location. */
const PROFILE_TTL_SECONDS = 300;
/** Bound the upstream request so the browser can retain its static snapshot promptly. */
const UPSTREAM_TIMEOUT_MS = 6_000;

/** GitHub's REST API version used by the existing build-time profile resolver. */
const GITHUB_API_VERSION = "2026-03-10";
/** Dedicated Cloudflare cache namespace for the one public profile response. */
const PROFILE_CACHE_NAME = "github-profile";

/** Generated asset bindings plus the optional runtime GitHub secret. */
interface WorkerEnv extends Env {
  /** Optional Worker secret; distinct from the build-time GitHub Actions token. */
  GITHUB_TOKEN?: string;
}

/** The response shape expected by the existing browser-side profile parser. */
interface PublicProfilePayload {
  /** Public GitHub login used to identify the profile. */
  login: string;
  /** Optional display name. */
  name: string | null;
  /** Public avatar URL. */
  avatar_url: string;
  /** Public GitHub profile URL. */
  html_url: string;
  /** Optional public biography. */
  bio: string | null;
  /** Optional public affiliation. */
  company: string | null;
  /** Optional personal website. */
  blog: string | null;
  /** Optional public location. */
  location: string | null;
  /** Public repository count. */
  public_repos: number;
  /** Follower count. */
  followers: number;
  /** Following count. */
  following: number;
  /** GitHub account creation timestamp. */
  created_at: string;
}

/**
 * Project a validated GitHub profile onto the stable, public browser contract.
 * This avoids forwarding unrelated upstream fields or an upstream authorization header.
 */
function toPublicPayload(profile: GitHubProfile): PublicProfilePayload {
  return {
    login: profile.login,
    name: profile.name,
    avatar_url: profile.avatarUrl,
    html_url: profile.profileUrl,
    bio: profile.bio,
    company: profile.company,
    blog: profile.blog,
    location: profile.location,
    public_repos: profile.publicRepositories,
    followers: profile.followers,
    following: profile.following,
    created_at: profile.createdAt,
  };
}

/** Return a small non-cacheable JSON error without disclosing upstream details. */
function errorResponse(status: number, message: string): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...(status === 429 || status === 503 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}

/** Fetch and validate the fixed public user; visitors cannot choose an upstream URL. */
async function fetchProfile(token?: string): Promise<Response> {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "me.moesegfault.dev-worker",
  });
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    const endpoint = `https://api.github.com/users/${encodeURIComponent(SITE.githubHandle)}`;
    const upstream = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (upstream.status === 403 || upstream.status === 429) {
      console.warn("[profile] GitHub rejected or rate-limited a profile refresh.");
      return errorResponse(429, "Profile temporarily unavailable");
    }
    if (!upstream.ok) {
      console.warn(`[profile] GitHub profile refresh returned HTTP ${upstream.status}.`);
      return errorResponse(503, "Profile temporarily unavailable");
    }

    const profile = parseGitHubProfile(await upstream.json());
    return Response.json(toPublicPayload(profile), {
      headers: {
        "Cache-Control": `public, max-age=${PROFILE_TTL_SECONDS}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.warn("[profile] GitHub profile refresh failed.", error);
    return errorResponse(503, "Profile temporarily unavailable");
  }
}

/**
 * Serve the same-origin profile endpoint while leaving static HTML and assets to Cloudflare.
 * Cache failures are non-fatal: the build-time snapshot remains the browser's fallback.
 */
async function serveProfile(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const cacheKey = new Request(new URL(PROFILE_PATH, request.url));
  let cache: Cache | undefined;
  try {
    cache = await caches.open(PROFILE_CACHE_NAME);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  } catch (error) {
    console.warn("[profile] Edge cache read failed; using GitHub directly.", error);
  }

  const response = await fetchProfile(env.GITHUB_TOKEN);
  if (response.ok && cache) {
    ctx.waitUntil(
      cache.put(cacheKey, response.clone()).catch((error) => {
        console.warn("[profile] Edge cache write failed.", error);
      }),
    );
  }
  return response;
}

/** Static-assets-first Worker entry point for the Cloudflare deployment. */
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (pathname !== PROFILE_PATH) return errorResponse(404, "Not found");
    if (request.method !== "GET") {
      const response = errorResponse(405, "Method not allowed");
      response.headers.set("Allow", "GET");
      return response;
    }
    return serveProfile(request, env, ctx);
  },
} satisfies ExportedHandler<WorkerEnv>;
