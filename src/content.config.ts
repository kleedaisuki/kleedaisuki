import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

/**
 * @brief Public home-page profile content collection.
 * @note Keep the site's profile independent of the user-owned repository README.
 *       Maintainer instructions in README must never be rendered on the public home page.
 */
const profile = defineCollection({
  loader: glob({ base: "./src/content/profile", pattern: "*.md" }),
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
 * @note Sidecars contain locale counterparts: English profile text and Chinese versions
 *       of the English uses/now documents. They do not own the primary source files.
 */
const translations = defineCollection({
  loader: glob({ base: "./src/content/translations", pattern: "*.md" }),
});

/** @brief Astro 内容集合注册表 / Astro content collection registry. */
export const collections = { docs, profile, translations };
