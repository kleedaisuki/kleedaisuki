import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/**
 * @brief GitHub 个人资料内容集合 / GitHub profile content collection.
 * @note 直接读取仓库根目录的 README.md，使网站与 GitHub Profile 共用唯一内容源。
 *       Reads the repository-root README.md so the website and GitHub Profile share one source.
 */
const profile = defineCollection({
  loader: glob({ base: ".", pattern: "README.md" }),
});

/**
 * @brief 常设 Markdown 页面集合 / Permanent Markdown page collection.
 * @note 从 docs 目录加载 uses 与 now 页面，新增文档无需改动加载器。
 *       Loads uses and now from docs; future documents require no loader change.
 */
const docs = defineCollection({
  loader: glob({ base: "./docs", pattern: "*.md" }),
});

/**
 * @brief 本地化 Markdown 侧车集合 / Localized Markdown sidecar collection.
 * @note 侧车仅承载翻译，原始 README 与 docs 文档仍是各自语言的权威内容源。
 *       Sidecars contain translations only; README and docs remain authoritative in their source language.
 */
const translations = defineCollection({
  loader: glob({ base: "./src/content/translations", pattern: "*.md" }),
});

/** @brief Astro 内容集合注册表 / Astro content collection registry. */
export const collections = { docs, profile, translations };
