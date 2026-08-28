import { SITE } from "../config/site";
import { type Locale, messages, type PageId, pageUrl } from "../i18n";

/** @brief 可发现核心页面的稳定顺序 (Stable order of discoverable core pages)。 */
const pages = ["home", "uses", "now", "projects", "contact"] as const satisfies readonly PageId[];

/** @brief llms.txt 中展示的语言顺序 (Locale order used in llms.txt)。 */
const localeSections = ["zh", "en"] as const satisfies readonly Locale[];

/** @brief 站点源代码的公开基准地址 (Public base URL for the site's source code)。 */
const sourceBase = `${SITE.githubUrl}/${SITE.githubHandle}`;

/** @brief 可供人和智能体继续阅读的源文档 (Source documents available to people and agents)。 */
const sourceDocuments = [
  ["README.md", `${sourceBase}/blob/main/README.md`],
  ["docs/uses.md", `${sourceBase}/blob/main/docs/uses.md`],
  ["docs/now.md", `${sourceBase}/blob/main/docs/now.md`],
] as const;

/**
 * @brief 生成一个语言分区的核心页面索引 (Build the core-page index for one locale)。
 * @param locale 要呈现的语言 (Locale to present)。
 * @return Markdown 链接列表 (Markdown link list)。
 */
function renderLocaleSection(locale: Locale): string {
  /** @brief 当前语言的文案目录 (Message catalog for the active locale)。 */
  const copy = messages[locale];
  /** @brief 当前语言分区标题 (Heading for the active locale section)。 */
  const heading = locale === "zh" ? "## 核心页面（简体中文）" : "## Core pages (English)";
  /** @brief 当前语言的页面链接行 (Page-link lines for the active locale)。 */
  const links = pages.map((page) => {
    /** @brief 当前页面的标题与摘要 (Title and description for the active page)。 */
    const metadata = copy.meta[page];
    return `- [${metadata.title}](${pageUrl(page, locale)}): ${metadata.description}`;
  });

  return [heading, ...links].join("\n");
}

/**
 * @brief 返回供智能体与搜索工具发现站点内容的纯文本索引 (Return a plain-text index for agent and search-tool discovery)。
 * @return UTF-8 纯文本响应 (UTF-8 plain-text response)。
 * @note llms.txt 是实验性的社区约定，而不是正式 Web 标准
 * (llms.txt is an experimental community convention, not an official Web standard)。
 */
export function GET(): Response {
  /** @brief 完整的 llms.txt 文本内容 (Complete llms.txt body)。 */
  const body = [
    `# ${SITE.name}`,
    "",
    `> ${messages.zh.meta.home.description}`,
    `> ${messages.en.meta.home.description}`,
    "",
    "本文件采用实验性的 llms.txt 社区索引格式；它不是 W3C、IETF 或其他标准组织发布的 Web 标准。",
    "This file follows the experimental llms.txt community index format; it is not a Web standard published by the W3C, IETF, or another standards body.",
    "",
    ...localeSections.flatMap((locale) => [renderLocaleSection(locale), ""]),
    "## 站外入口 / External destinations",
    `- [GitHub](${SITE.githubUrl})`,
    `- [Blog](${SITE.blogUrl})`,
    `- [FOGMOE Bot](${SITE.botUrl})`,
    "",
    "## 源文档 / Source documents",
    ...sourceDocuments.map(([label, href]) => `- [${label}](${href})`),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
