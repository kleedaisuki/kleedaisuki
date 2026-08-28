import { PROJECT_FALLBACK } from "../data/project-fallback";

/**
 * @brief 项目卡片所需的规范化仓库数据 (normalized repository data required by project cards)。
 * @note 此接口刻意隔离 GitHub REST 响应，避免页面组件依赖外部 API 的完整数据形状 (This interface deliberately isolates the GitHub REST response from page components)。
 */
export interface GitHubProject {
  /** @brief 仓库名称 (repository name)。 */
  name: string;
  /** @brief 仓库简介 (repository description)。 */
  description: string | null;
  /** @brief GitHub 仓库地址 (GitHub repository URL)。 */
  repositoryUrl: string;
  /** @brief 项目主页地址 (project homepage URL)。 */
  homepage: string | null;
  /** @brief 主要编程语言 (primary programming language)。 */
  language: string | null;
  /** @brief 星标数量 (stargazer count)。 */
  stars: number;
  /** @brief 分叉数量 (fork count)。 */
  forks: number;
  /** @brief GitHub 主题标签 (GitHub topic labels)。 */
  topics: string[];
  /** @brief 最近更新时间，采用 ISO 8601 格式 (last update time in ISO 8601 format)。 */
  updatedAt: string;
}

/**
 * @brief GitHub REST 仓库响应的最小数据形状 (minimal GitHub REST repository response shape)。
 */
interface GitHubRepositoryResponse {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  updated_at: string;
  fork: boolean;
}

/** @brief GitHub API 的媒体类型 (GitHub API media type)。 */
const GITHUB_ACCEPT = "application/vnd.github+json";

/** @brief GitHub REST API 版本 (GitHub REST API version)。 */
const GITHUB_API_VERSION = "2022-11-28";

/** @brief 外部请求的最长等待时间，单位为毫秒 (maximum external request duration in milliseconds)。 */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * @brief 获取指定用户的公开自有项目 (fetch public owner repositories for a user)。
 * @param username GitHub 用户名 (GitHub username)。
 * @return 按最近更新时间降序排列、排除分叉与个人资料仓库的项目 (Projects sorted by update time descending, excluding forks and the profile repository)。
 * @note GitHub 不可用、限流或响应异常时记录明确告警并返回静态后备数据，构建不会中断 (On GitHub outage, rate limiting, or malformed responses, logs a clear warning and returns static fallback data without interrupting the build)。
 * @example
 * const projects = await getGitHubProjects("kleedaisuki");
 * // 获取可直接传递给项目卡片的数据 / Gets data ready for project cards.
 */
export async function getGitHubProjects(username = "kleedaisuki"): Promise<GitHubProject[]> {
  /** @brief GitHub 仓库列表端点 (GitHub repository-list endpoint)。 */
  const endpoint = new URL(
    `/users/${encodeURIComponent(username)}/repos`,
    "https://api.github.com",
  );
  endpoint.search = new URLSearchParams({
    type: "owner",
    sort: "updated",
    direction: "desc",
    per_page: "100",
  }).toString();

  /** @brief GitHub API 请求头 (GitHub API request headers)。 */
  const headers = new Headers({
    Accept: GITHUB_ACCEPT,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "me.moesegfault.dev-build",
  });
  /** @brief CI 可选的 GitHub 访问令牌 (optional GitHub access token supplied by CI)。 */
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  try {
    /** @brief GitHub REST 的 HTTP 响应 (HTTP response from GitHub REST)。 */
    const response = await fetch(endpoint, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      /** @brief GitHub 剩余请求配额 (remaining GitHub request quota)。 */
      const remaining = response.headers.get("x-ratelimit-remaining") ?? "unknown";
      throw new Error(
        `GitHub REST returned ${response.status} ${response.statusText}; rate-limit remaining=${remaining}`,
      );
    }

    /** @brief 未经信任的 GitHub JSON 响应 (untrusted GitHub JSON response)。 */
    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      throw new TypeError("GitHub REST response was not a repository array");
    }

    /** @brief 经过页面字段映射与过滤的项目 (projects mapped and filtered for the page)。 */
    const projects = (payload as GitHubRepositoryResponse[])
      .filter(
        (repository) =>
          repository &&
          typeof repository.name === "string" &&
          typeof repository.html_url === "string" &&
          repository.fork === false &&
          repository.name.toLocaleLowerCase("en-US") !== username.toLocaleLowerCase("en-US"),
      )
      .map((repository) => ({
        name: repository.name,
        description: repository.description ?? null,
        repositoryUrl: repository.html_url,
        homepage: repository.homepage || null,
        language: repository.language ?? null,
        stars: Number.isFinite(repository.stargazers_count) ? repository.stargazers_count : 0,
        forks: Number.isFinite(repository.forks_count) ? repository.forks_count : 0,
        topics: Array.isArray(repository.topics)
          ? repository.topics.filter((topic) => typeof topic === "string")
          : [],
        updatedAt: repository.updated_at,
      }))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    console.info(
      `[projects] Loaded ${projects.length} public owner repositories from GitHub REST for ${username}.`,
    );
    return projects;
  } catch (error) {
    /** @brief 便于构建日志阅读的错误文本 (build-log-friendly error text)。 */
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(
      `[projects] WARNING: GitHub REST data unavailable for ${username}; continuing with ${PROJECT_FALLBACK.length} fallback projects. Reason: ${reason}`,
    );
    return [...PROJECT_FALLBACK];
  }
}
