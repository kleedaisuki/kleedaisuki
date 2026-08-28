import { marked } from "marked";

/** @brief 文档展陈的视觉变体 (Visual variants for document showcases)。 */
export type ShowcaseVariant = "toolkit" | "pulse";

/** @brief 展陈区块中的三级主题 (Tertiary topic inside a showcase section)。 */
export interface ShowcaseItem {
  /** @brief 主题标题 (Topic title)。 */
  readonly title: string;
  /** @brief 从受控 Markdown 构建出的静态 HTML (Static HTML built from controlled Markdown)。 */
  readonly html: string;
}

/** @brief 展陈文档中的二级章节 (Secondary section in a showcase document)。 */
export interface ShowcaseSection {
  /** @brief 章节标题 (Section title)。 */
  readonly title: string;
  /** @brief 章节标题前的正文 HTML (Body HTML before nested topics)。 */
  readonly html: string;
  /** @brief 章节内的三级主题 (Nested tertiary topics)。 */
  readonly items: readonly ShowcaseItem[];
}

/** @brief 已章节化的 Markdown 展陈数据 (Sectionized Markdown showcase data)。 */
export interface ShowcaseDocument {
  /** @brief 文档一级标题 (Primary document title)。 */
  readonly title: string;
  /** @brief 文档内记录的更新时间 (Update date recorded in the document)。 */
  readonly updated?: string;
  /** @brief 第一个二级标题前的导言 HTML (Introductory HTML before the first secondary heading)。 */
  readonly introHtml: string;
  /** @brief 按源文档顺序排列的章节 (Sections in source-document order)。 */
  readonly sections: readonly ShowcaseSection[];
}

/** @brief 解析过程中的可变三级主题 (Mutable tertiary topic used while parsing)。 */
interface MutableItem {
  /** @brief 主题标题 (Topic title)。 */
  title: string;
  /** @brief 尚未渲染的 Markdown 行 (Unrendered Markdown lines)。 */
  lines: string[];
}

/** @brief 解析过程中的可变二级章节 (Mutable secondary section used while parsing)。 */
interface MutableSection {
  /** @brief 章节标题 (Section title)。 */
  title: string;
  /** @brief 章节导言的 Markdown 行 (Markdown lines for the section introduction)。 */
  lines: string[];
  /** @brief 已完成的三级主题 (Completed tertiary topics)。 */
  items: ShowcaseItem[];
}

/** @brief Markdown 标题行的匹配表达式 (Pattern matching Markdown heading lines)。 */
const headingPattern = /^(#{1,3})\s+(.+?)\s*#*\s*$/;
/** @brief 中英文更新时间行的匹配表达式 (Pattern matching localized update-date lines)。 */
const updatedPattern = /^(?:Updated|更新于)\s*[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/i;

/**
 * @brief 把受控 Markdown 片段渲染为静态 HTML (Render a controlled Markdown fragment to static HTML)。
 * @param lines Markdown 源行 (Markdown source lines)。
 * @return 构建期生成的 HTML (HTML generated at build time)。
 */
function renderLines(lines: readonly string[]): string {
  /** @brief 去除首尾空白后的 Markdown 片段 (Trimmed Markdown fragment)。 */
  const markdown = lines.join("\n").trim();
  return markdown ? (marked.parse(markdown, { async: false }) as string) : "";
}

/**
 * @brief 将标题分层的 Markdown 转换为展陈数据 (Convert heading-structured Markdown into showcase data)。
 * @param markdown 完整 Markdown 正文 (Complete Markdown body)。
 * @return 保持原始语义顺序的展陈文档 (Showcase document preserving source semantic order)。
 * @note 没有二级标题时，正文自然保留在导言中 (When no secondary headings exist, the body naturally remains in the introduction)。
 */
export function parseShowcaseDocument(markdown: string): ShowcaseDocument {
  /** @brief 文档一级标题 (Primary document title)。 */
  let title = "";
  /** @brief 文档更新时间 (Document update date)。 */
  let updated: string | undefined;
  /** @brief 文档导言行 (Document introduction lines)。 */
  const introLines: string[] = [];
  /** @brief 已完成章节 (Completed sections)。 */
  const sections: ShowcaseSection[] = [];
  /** @brief 当前解析章节 (Section currently being parsed)。 */
  let section: MutableSection | undefined;
  /** @brief 当前解析主题 (Topic currently being parsed)。 */
  let item: MutableItem | undefined;

  /** @brief 完成当前三级主题 (Finalize the current tertiary topic)。 */
  const finishItem = (): void => {
    if (!section || !item) return;
    section.items.push({ title: item.title, html: renderLines(item.lines) });
    item = undefined;
  };

  /** @brief 完成当前二级章节 (Finalize the current secondary section)。 */
  const finishSection = (): void => {
    finishItem();
    if (!section) return;
    sections.push({
      title: section.title,
      html: renderLines(section.lines),
      items: section.items,
    });
    section = undefined;
  };

  for (const line of markdown.split(/\r?\n/)) {
    /** @brief 当前行的标题匹配结果 (Heading match for the current line)。 */
    const heading = line.match(headingPattern);
    /** @brief 当前标题的纯文本，非标题行为空 (Plain heading text, empty for non-heading lines)。 */
    const headingText = heading?.[2] ?? "";
    if (heading?.[1] === "#") {
      title ||= headingText;
      continue;
    }
    if (heading?.[1] === "##") {
      finishSection();
      section = { title: headingText, lines: [], items: [] };
      continue;
    }
    if (heading?.[1] === "###" && section) {
      finishItem();
      item = { title: headingText, lines: [] };
      continue;
    }

    if (!section) {
      /** @brief 当前导言行中的更新时间匹配 (Update-date match in the current intro line)。 */
      const update = line.match(updatedPattern);
      if (update) {
        updated = update[1];
      } else {
        introLines.push(line);
      }
      continue;
    }

    (item?.lines ?? section.lines).push(line);
  }

  finishSection();
  return {
    title,
    ...(updated ? { updated } : {}),
    introHtml: renderLines(introLines),
    sections,
  };
}
