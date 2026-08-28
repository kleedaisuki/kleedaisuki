import type { GitHubProfile } from "../lib/github-profile";

/**
 * @brief GitHub 用户资料接口不可用时使用的公开资料快照 (Public profile snapshot used when the GitHub user endpoint is unavailable)。
 * @note 数值字段只是保障构建与页面表达连续性的后备值，在线构建通常会以 GitHub REST 数据覆盖 (Numeric fields are fallback values for continuous builds and presentation; online builds normally replace them with GitHub REST data)。
 */
export const PROFILE_FALLBACK: Readonly<GitHubProfile> = {
  login: "kleedaisuki",
  name: "MoeSegFault",
  avatarUrl: "https://avatars.githubusercontent.com/u/189504231?v=4",
  profileUrl: "https://github.com/kleedaisuki",
  bio: "Vibe coding is all you need!",
  company: "College of Computer Science, Nankai University",
  blog: "https://me.moesegfault.dev",
  location: "Tianjin, China",
  publicRepositories: 19,
  followers: 6,
  following: 3,
  createdAt: "2024-11-24T05:57:43Z",
};
