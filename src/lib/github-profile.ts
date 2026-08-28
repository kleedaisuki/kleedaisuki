import { PROFILE_FALLBACK } from "../data/profile-fallback";

/**
 * @brief 首页展示所需的规范化 GitHub 用户资料 (Normalized GitHub user profile required by the home page)。
 * @note 此接口刻意只暴露稳定的展示字段，使组件不依赖完整的 GitHub REST 响应 (This interface deliberately exposes only stable presentation fields so components do not depend on the full GitHub REST response)。
 */
export interface GitHubProfile {
  /** @brief GitHub 登录名 (GitHub login)。 */
  login: string;
  /** @brief 用户显示名称 (user display name)。 */
  name: string | null;
  /** @brief 头像图片地址 (avatar image URL)。 */
  avatarUrl: string;
  /** @brief GitHub 个人资料地址 (GitHub profile URL)。 */
  profileUrl: string;
  /** @brief 个人简介 (profile biography)。 */
  bio: string | null;
  /** @brief 所属组织或单位 (affiliated organization or institution)。 */
  company: string | null;
  /** @brief 个人网站地址 (personal website URL)。 */
  blog: string | null;
  /** @brief 公开所在地 (public location)。 */
  location: string | null;
  /** @brief 公开仓库数量 (public repository count)。 */
  publicRepositories: number;
  /** @brief 关注者数量 (follower count)。 */
  followers: number;
  /** @brief 正在关注的用户数量 (following count)。 */
  following: number;
  /** @brief 账户创建时间，采用 ISO 8601 格式 (account creation time in ISO 8601 format)。 */
  createdAt: string;
}

/**
 * @brief GitHub 用户资料及其数据来源 (GitHub user profile and its data source)。
 */
export interface GitHubProfileSnapshot {
  /** @brief 可供首页渲染的用户资料 (user profile ready for home-page rendering)。 */
  profile: GitHubProfile;
  /** @brief 数据来自 GitHub 或静态快照 (whether data came from GitHub or the static snapshot)。 */
  source: "github" | "fallback";
}

/**
 * @brief GitHub REST 用户响应的最小数据形状 (Minimal GitHub REST user response shape)。
 */
interface GitHubUserResponse {
  login: unknown;
  name: unknown;
  avatar_url: unknown;
  html_url: unknown;
  bio: unknown;
  company: unknown;
  blog: unknown;
  location: unknown;
  public_repos: unknown;
  followers: unknown;
  following: unknown;
  created_at: unknown;
}

/** @brief GitHub API 的媒体类型 (GitHub API media type)。 */
const GITHUB_ACCEPT = "application/vnd.github+json";

/** @brief GitHub REST API 版本 (GitHub REST API version)。 */
const GITHUB_API_VERSION = "2022-11-28";

/** @brief 外部请求的最长等待时间，单位为毫秒 (Maximum external request duration in milliseconds)。 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * @brief 将可选文本字段规范化为字符串或空值 (Normalize an optional text field to a string or null)。
 * @param value GitHub REST 返回的未知字段值 (Unknown field value returned by GitHub REST)。
 * @return 非空字符串或空值 (A non-empty string or null)。
 */
function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * @brief 校验并映射 GitHub 用户响应 (Validate and map a GitHub user response)。
 * @param payload GitHub REST 返回的未知 JSON 数据 (Unknown JSON payload returned by GitHub REST)。
 * @return 规范化后的用户资料 (The normalized user profile)。
 * @note 必需字段缺失时抛出类型错误，由调用方统一切换到后备快照 (Throws a type error when required fields are missing so the caller can consistently use the fallback snapshot)。
 */
function mapGitHubProfile(payload: unknown): GitHubProfile {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("GitHub REST response was not a user object");
  }

  /** @brief 具有最小字段集合的 GitHub 用户响应 (GitHub user response with the minimal field set)。 */
  const user = payload as GitHubUserResponse;
  if (
    typeof user.login !== "string" ||
    typeof user.avatar_url !== "string" ||
    typeof user.html_url !== "string" ||
    typeof user.public_repos !== "number" ||
    typeof user.followers !== "number" ||
    typeof user.following !== "number" ||
    typeof user.created_at !== "string"
  ) {
    throw new TypeError("GitHub REST user response omitted required profile fields");
  }

  return {
    login: user.login,
    name: optionalText(user.name),
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: optionalText(user.bio),
    company: optionalText(user.company),
    blog: optionalText(user.blog),
    location: optionalText(user.location),
    publicRepositories: user.public_repos,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
  };
}

/**
 * @brief 获取指定用户的公开 GitHub 基本资料 (Fetch the public GitHub profile for a user)。
 * @param username GitHub 用户名 (GitHub username)。
 * @return 包含数据来源的规范化用户资料快照 (A normalized user profile snapshot with its data source)。
 * @note GitHub 不可用、限流或响应异常时记录明确告警并返回静态后备数据，构建不会中断 (When GitHub is unavailable, rate-limited, or malformed, logs a clear warning and returns the static fallback without interrupting the build)。
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
    const profile = mapGitHubProfile(payload);
    console.info(`[profile] Loaded public GitHub profile for ${username}.`);
    return { profile, source: "github" };
  } catch (error) {
    /** @brief 便于构建日志阅读的错误文本 (Build-log-friendly error text)。 */
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(
      `[profile] WARNING: GitHub REST profile unavailable for ${username}; continuing with the fallback snapshot. Reason: ${reason}`,
    );
    return { profile: { ...PROFILE_FALLBACK }, source: "fallback" };
  }
}
