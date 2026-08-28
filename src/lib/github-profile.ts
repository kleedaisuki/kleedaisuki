import { parseGitHubProfile, type GitHubProfile } from "./github-profile-model.ts";
export type { GitHubProfile } from "./github-profile-model.ts";

/**
 * @brief GitHub 用户资料及其数据来源 (GitHub user profile and its data source)。
 */
export interface GitHubProfileSnapshot {
  /** @brief 可供首页渲染的用户资料 (user profile ready for home-page rendering)。 */
  profile: GitHubProfile;
  /** @brief 数据来自构建期 GitHub 请求 (Whether data came from the build-time GitHub request)。 */
  source: "github";
}

/** @brief GitHub API 的媒体类型 (GitHub API media type)。 */
const GITHUB_ACCEPT = "application/vnd.github+json";

/** @brief GitHub REST API 版本 (GitHub REST API version)。 */
const GITHUB_API_VERSION = "2026-03-10";

/** @brief 外部请求的最长等待时间，单位为毫秒 (Maximum external request duration in milliseconds)。 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * @brief 获取指定用户的公开 GitHub 基本资料 (Fetch the public GitHub profile for a user)。
 * @param username GitHub 用户名 (GitHub username)。
 * @return 包含数据来源的规范化用户资料快照 (A normalized user profile snapshot with its data source)。
 * @note GitHub 不可用、限流或响应异常时终止构建，确保每个成功产物都带有有效的静态资料 (When GitHub is unavailable, rate-limited, or malformed, aborts the build so every successful artifact contains a valid static profile)。
 * @example
 * const snapshot = await getGitHubProfile("kleedaisuki");
 * // 获取可直接传递给首页的数据 / Gets data ready for the home page.
 */
export async function getGitHubProfile(username = "kleedaisuki"): Promise<GitHubProfileSnapshot> {
  /** @brief GitHub 用户资料端点 (GitHub user-profile endpoint)。 */
  const endpoint = new URL(`/users/${encodeURIComponent(username)}`, "https://api.github.com");
  /** @brief GitHub API 请求头 (GitHub API request headers)。 */
  const headers = new Headers({
    Accept: GITHUB_ACCEPT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "me.moesegfault.dev-build",
  });
  /** @brief CI 提供的可选 GitHub 访问令牌 (Optional GitHub access token supplied by CI)。 */
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    /** @brief GitHub REST 的 HTTP 响应 (HTTP response from GitHub REST)。 */
    const response = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      /** @brief GitHub 剩余请求配额 (Remaining GitHub request quota)。 */
      const remaining = response.headers.get("x-ratelimit-remaining") ?? "unknown";
      throw new Error(
        `GitHub REST returned ${response.status} ${response.statusText}; rate-limit remaining=${remaining}`,
      );
    }

    /** @brief 未经映射的 GitHub JSON 响应 (Unmapped GitHub JSON response)。 */
    const payload: unknown = await response.json();
    /** @brief 映射为页面窄类型的 GitHub 用户资料 (GitHub user profile mapped to the page's narrow type)。 */
    const profile = parseGitHubProfile(payload);
    console.info(`[profile] Loaded public GitHub profile for ${username}.`);
    return { profile, source: "github" };
  } catch (error) {
    /** @brief 便于构建日志阅读的错误文本 (Build-log-friendly error text)。 */
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.error(
      `[profile] ERROR: GitHub REST profile unavailable for ${username}; refusing to build without a valid static profile. Reason: ${reason}`,
    );
    throw new Error(`Unable to build a static GitHub profile for ${username}`, { cause: error });
  }
}
