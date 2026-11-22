import type { Locale } from "../i18n";

/** Bilingual text shared by public contact and platform links. */
export type LocalizedText = Readonly<Record<Locale, string>>;

/** Fields every public destination shares. */
interface LinkDetails {
  readonly label: LocalizedText;
  readonly href: string;
}

/**
 * A link for finding or contacting moeSegFault, not a product landing page.
 */
export interface ContactLink extends LinkDetails {
  /** Stable contact identity and styling hook. */
  readonly id: "github" | "me" | "blog" | "bot";
  /** Discriminator used for accessible action text and card attributes. */
  readonly kind: "contact";
  /** The address itself: it already says where the link goes. */
  readonly display: string;
  /** The channel to try first. */
  readonly preferred?: boolean;
}

/** A user-confirmed public product or design-system landing page. */
export interface PlatformLink extends LinkDetails {
  /** Stable platform identity and styling hook. */
  readonly id: "same" | "scrap" | "xmlsquish" | "style";
  /** Discriminator used for accessible action text and card attributes. */
  readonly kind: "platform";
  /** Product names are opaque, so each needs one sentence. */
  readonly description: LocalizedText;
}

/** Every destination the contact page can render. */
export type PublicLink = ContactLink | PlatformLink;

/**
 * moeSegFault's existing contact destinations; their links remain unchanged.
 */
export const contacts: readonly ContactLink[] = [
  {
    id: "github",
    kind: "contact",
    label: { zh: "GitHub", en: "GitHub" },
    href: "https://github.com/kleedaisuki",
    display: "github.com/kleedaisuki",
    preferred: true,
  },
  {
    id: "me",
    kind: "contact",
    label: { zh: "个人主页", en: "Personal home" },
    href: "https://me.moesegfault.dev/",
    display: "me.moesegfault.dev",
  },
  {
    id: "blog",
    kind: "contact",
    label: { zh: "博客", en: "Blog" },
    href: "https://atelier.moesegfault.dev/",
    display: "atelier.moesegfault.dev",
  },
  {
    id: "bot",
    kind: "contact",
    label: { zh: "FOGMOE Bot", en: "FOGMOE Bot" },
    href: "https://bot.moesegfault.dev/",
    display: "bot.moesegfault.dev",
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
  },
  {
    id: "style",
    kind: "platform",
    label: { zh: "moeSegFault Style", en: "moeSegFault Style" },
    description: {
      zh: "绯红与蜜金的设计系统，面向 React、Astro 与纯 HTML。",
      en: "A crimson and honey design system for React, Astro, and plain HTML.",
    },
    href: "https://style.moesegfault.dev/",
  },
] as const;
