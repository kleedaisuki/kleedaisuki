import { SITE } from "../config/site";
import { getGitHubProfile, type GitHubProfileSnapshot } from "./github-profile";

/**
 * @brief 本次构建共享的用户资料请求 (User-profile request shared by this build)。
 * @note 模块级 Promise 让所有页面与语言版本复用同一次 GitHub 请求，同时保留可观测的后备行为 (The module-level promise lets every page and locale reuse one GitHub request while preserving observable fallback behavior)。
 */
const profileSnapshotPromise: Promise<GitHubProfileSnapshot> = getGitHubProfile(SITE.githubHandle);

/**
 * @brief 获取本次构建共享的 GitHub 用户资料快照 (Get the build-scoped shared GitHub user profile snapshot)。
 * @return GitHub 实时资料或可观测的静态后备快照 (The live GitHub profile or observable static fallback snapshot)。
 */
export function getProfileSnapshot(): Promise<GitHubProfileSnapshot> {
  return profileSnapshotPromise;
}
