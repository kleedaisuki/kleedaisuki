import type { Locale } from "../i18n";

/** Bilingual text shared by public contact and platform links. */
export type LocalizedText = Readonly<Record<Locale, string>>;

/**
 * Shared presentation fields for a public destination.
 * Keeping both locales in each record prevents link and ordering drift.
 */
interface LinkDetails {
  /** Visitor-facing name in both supported languages. */
  readonly label: LocalizedText;
  /** Short visitor-facing explanation in both languages. */
  readonly description: LocalizedText;
  /** Canonical HTTPS destination. */
  readonly href: string;
  /** Compact hostname shown on the card. */
  readonly display: string;
  /** Decorative two-letter glyph. */
  readonly glyph: string;
  /** Whether this is the recommended primary contact channel. */
  readonly preferred?: boolean;
}

/**
 * A link for finding or contacting MoeSegFault, not a product landing page.
 */
export interface ContactLink extends LinkDetails {
  /** Stable contact identity and styling hook. */
  readonly id: "github" | "me" | "blog" | "bot";
  /** Discriminator used for accessible action text and card attributes. */
  readonly kind: "contact";
}

/** A user-confirmed public product or design-system landing page. */
export interface PlatformLink extends LinkDetails {
  /** Stable platform identity and styling hook. */
  readonly id: "same" | "scrap" | "xmlsquish" | "style";
  /** Discriminator used for accessible action text and card attributes. */
  readonly kind: "platform";
}

/** Every destination the contact page can render. */
export type PublicLink = ContactLink | PlatformLink;

/**
 * MoeSegFault's existing contact destinations; their links remain unchanged.
 */
export const contacts: readonly ContactLink[] = [
  {
    id: "github",
    kind: "contact",
    label: { zh: "GitHub", en: "GitHub" },
    description: {
      zh: "查看 MoeSegFault 的代码、开源项目与开发动态。",
      en: "Explore MoeSegFault's code, open-source projects, and development activity.",
    },
    href: "https://github.com/kleedaisuki",
    display: "github.com/kleedaisuki",
    glyph: "GH",
    preferred: true,
  },
  {
    id: "me",
    kind: "contact",
    label: { zh: "个人主页", en: "Personal home" },
    description: {
      zh: "了解 MoeSegFault、最近在做的事情与公开作品。",
      en: "Meet MoeSegFault and discover current work and public creations.",
    },
    href: "https://me.moesegfault.dev/",
    display: "me.moesegfault.dev",
    glyph: "ME",
  },
  {
    id: "blog",
    kind: "contact",
    label: { zh: "博客", en: "Blog" },
    description: {
      zh: "阅读技术笔记、研究思考与值得长期保留的文字。",
      en: "Read engineering notes, research thoughts, and writing worth keeping.",
    },
    href: "https://atelier.moesegfault.dev/",
    display: "atelier.moesegfault.dev",
    glyph: "BL",
  },
  {
    id: "bot",
    kind: "contact",
    label: { zh: "FOGMOE Bot", en: "FOGMOE Bot" },
    description: {
      zh: "访问 MoeSegFault 的社区机器人与相关服务。",
      en: "Visit MoeSegFault's community bot and related services.",
    },
    href: "https://bot.moesegfault.dev/",
    display: "bot.moesegfault.dev",
    glyph: "BT",
  },
] as const;

/**
 * Public platforms confirmed by the owner from the current domain inventory.
 * The retired PromptR site and infrastructure-only hostnames are deliberately absent.
 */
export const platforms: readonly PlatformLink[] = [
  {
    id: "same",
    kind: "platform",
    label: { zh: "same", en: "same" },
    description: {
      zh: "准确找出本地真正相同的文件，整理重复内容。",
      en: "Find truly identical local files and make duplicate cleanup easier.",
    },
    href: "https://same.moesegfault.dev/",
    display: "same.moesegfault.dev",
    glyph: "SA",
  },
  {
    id: "scrap",
    kind: "platform",
    label: { zh: "scrap", en: "scrap" },
    description: {
      zh: "本地优先的秘密与字段存储，连接桌面应用和命令行。",
      en: "Local-first secrets and field storage across a desktop app and CLI.",
    },
    href: "https://scrap.moesegfault.dev/",
    display: "scrap.moesegfault.dev",
    glyph: "SC",
  },
  {
    id: "xmlsquish",
    kind: "platform",
    label: { zh: "xmlsquish", en: "xmlsquish" },
    description: {
      zh: "创建、格式化并构建多文件 XML 提示词项目。",
      en: "Create, format, and build multi-file XML prompt projects.",
    },
    href: "https://xmlsquish.moesegfault.dev/",
    display: "xmlsquish.moesegfault.dev",
    glyph: "XS",
  },
  {
    id: "style",
    kind: "platform",
    label: { zh: "MoeSegFault Style", en: "MoeSegFault Style" },
    description: {
      zh: "面向 TypeScript、React 与 Astro 的暖纸编辑风格设计系统。",
      en: "A warm editorial design system for TypeScript, React, and Astro.",
    },
    href: "https://style.moesegfault.dev/",
    display: "style.moesegfault.dev",
    glyph: "ST",
  },
] as const;
