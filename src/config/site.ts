/**
 * @brief 站点级稳定配置 (Stable site-wide configuration)。
 * @note 品牌名与 GitHub 用户名是两个独立标识，不应互相推导
 * (The brand name and GitHub handle are independent identities and must not be derived from one another)。
 */
export const SITE = {
  name: "MoeSegFault",
  title: "MoeSegFault · me",
  url: "https://me.moesegfault.dev",
  githubHandle: "kleedaisuki",
  githubUrl: "https://github.com/kleedaisuki",
  blogUrl: "https://blog.moesegfault.dev",
  botUrl: "https://bot.moesegfault.dev",
  startYear: 2024,
} as const;

/** @brief 站点配置类型 (Site configuration type)。 */
export type SiteConfig = typeof SITE;
