import { getCollection, render } from "astro:content";
import type { Locale } from "./types";

/** @brief 可本地化的 Markdown 文档标识 / Localizable Markdown document identifiers. */
export type LocalizedDocumentId = "profile" | "uses" | "now";

/** @brief 本地化文档的渲染结果 / Rendered localized-document result. */
export interface LocalizedDocument {
  /** @brief 已渲染的 Astro Markdown 组件 / Rendered Astro Markdown component. */
  Content: Awaited<ReturnType<typeof render>>["Content"];
}

/**
 * @brief 查找内容集合中的必需条目 / Find a required entry in a content collection.
 * @param entries 待查找的内容条目 / Content entries to search.
 * @param id 不含扩展名的条目标识 / Entry identifier without a file extension.
 * @return 匹配的内容条目 / Matching content entry.
 * @note 缺少仓库内必需内容属于构建输入错误，因此错误信息会同时指出集合与条目。
 *       Missing required repository content is a build-input error, so the error names both collection and entry.
 */
function requireEntry<T extends { id: string }>(entries: readonly T[], id: string): T {
  const entry = entries.find((candidate) => candidate.id.toLowerCase() === id.toLowerCase());
  if (!entry) {
    throw new Error(`Required localized content entry was not found: ${id}.`);
  }
  return entry;
}

/**
 * @brief 加载并渲染指定语言的 Markdown 文档 / Load and render a Markdown document for a locale.
 * @param documentId 文档标识 / Document identifier.
 * @param locale 目标语言 / Target locale.
 * @return 可直接渲染的文档组件 / Renderable document component.
 */
export async function getLocalizedDocument(
  documentId: LocalizedDocumentId,
  locale: Locale,
): Promise<LocalizedDocument> {
  if (documentId === "profile" && locale === "zh") {
    const entry = requireEntry(await getCollection("profile"), "README");
    const { Content } = await render(entry);
    return { Content };
  }

  if (documentId === "profile") {
    const entry = requireEntry(await getCollection("translations"), "profile");
    const { Content } = await render(entry);
    return { Content };
  }

  if (locale === "en") {
    const entry = requireEntry(await getCollection("docs"), documentId);
    const { Content } = await render(entry);
    return { Content };
  }

  const entry = requireEntry(await getCollection("translations"), documentId);
  const { Content } = await render(entry);
  return { Content };
}
