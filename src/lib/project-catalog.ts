import { getGitHubProjects, type GitHubProjectDirectory } from "./github";

/** @brief GitHub 项目所有者 (GitHub project owner)。 */
const PROJECT_OWNER = "kleedaisuki";

/**
 * @brief 本次构建共享的项目目录请求 (Project-directory request shared by this build)。
 * @note 模块级 Promise 让中英文页面复用同一次 GitHub 请求，同时保留 github.ts 的日志与离线回退行为 (The module-level promise lets Chinese and English pages reuse one GitHub request while preserving github.ts logging and offline fallback behavior)。
 */
const projectDirectoryPromise: Promise<GitHubProjectDirectory> = getGitHubProjects(PROJECT_OWNER);

/**
 * @brief 获取本次构建共享的 GitHub 项目目录 (Get the build-scoped shared GitHub project directory)。
 * @return GitHub 实时目录或可观测的离线快照 (The live GitHub directory or observable offline snapshot)。
 */
export function getProjectDirectory(): Promise<GitHubProjectDirectory> {
  return projectDirectoryPromise;
}
