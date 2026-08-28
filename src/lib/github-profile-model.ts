/**
 * @brief 首页展示所需的规范化 GitHub 用户资料 (Normalized GitHub user profile required by the home page)。
 * @note 此接口只暴露稳定展示字段，供构建期与浏览器动态增强共同使用 (This interface exposes only stable presentation fields shared by build-time rendering and browser enhancement)。
 */
export interface GitHubProfile {
  /** @brief GitHub 登录名 (GitHub login)。 */
  login: string;
  /** @brief 用户显示名称 (User display name)。 */
  name: string | null;
  /** @brief 头像图片地址 (Avatar image URL)。 */
  avatarUrl: string;
  /** @brief GitHub 个人资料地址 (GitHub profile URL)。 */
  profileUrl: string;
  /** @brief 个人简介 (Profile biography)。 */
  bio: string | null;
  /** @brief 所属组织或单位 (Affiliated organization or institution)。 */
  company: string | null;
  /** @brief 个人网站地址 (Personal website URL)。 */
  blog: string | null;
  /** @brief 公开所在地 (Public location)。 */
  location: string | null;
  /** @brief 公开仓库数量 (Public repository count)。 */
  publicRepositories: number;
  /** @brief 关注者数量 (Follower count)。 */
  followers: number;
  /** @brief 正在关注的用户数量 (Following count)。 */
  following: number;
  /** @brief 账户创建时间，采用 ISO 8601 格式 (Account creation time in ISO 8601 format)。 */
  createdAt: string;
}

/** @brief GitHub REST 用户响应的最小数据形状 (Minimal GitHub REST user response shape)。 */
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
 * @note 必需字段缺失时抛出类型错误，不允许部分资料覆盖静态内容 (Throws when required fields are missing so partial data never replaces the static profile)。
 */
export function parseGitHubProfile(payload: unknown): GitHubProfile {
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
