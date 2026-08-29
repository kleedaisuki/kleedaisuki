import type { Locale } from "../i18n";

/** @brief 双语文本值 (Bilingual text value)。 */
export type LocalizedText = Readonly<Record<Locale, string>>;

/**
 * @brief 联系方式条目的数据模型 (Contact-channel data model)。
 * @note 渠道身份与双语文案位于同一条记录中，避免两套列表发生顺序或链接漂移 (Channel identity and bilingual copy live in one record to prevent ordering or URL drift between locale-specific lists)。
 */
export interface ContactLink {
  /** @brief 稳定标识符，用于列表键与样式钩子 (Stable identifier for list keys and style hooks)。 */
  readonly id: "github" | "me" | "blog" | "bot";
  /** @brief 面向访客的双语渠道名称 (Localized visitor-facing channel name)。 */
  readonly label: LocalizedText;
  /** @brief 该渠道用途的双语说明 (Localized description of the channel purpose)。 */
  readonly description: LocalizedText;
  /** @brief 渠道的规范链接 (Canonical URL for the channel)。 */
  readonly href: string;
  /** @brief 卡片中展示的紧凑地址 (Compact address displayed in the card)。 */
  readonly display: string;
  /** @brief 纯装饰的渠道字形 (Decorative channel glyph)。 */
  readonly glyph: string;
  /** @brief 是否为推荐的首选联系方式 (Whether this is the preferred contact channel)。 */
  readonly preferred?: boolean;
}

/**
 * @brief MoeSegFault 公开入口的唯一数据源 (Single source of truth for MoeSegFault's public entry points)。
 * @note 新增真实渠道只需追加一项，同时填写中英文文案；不要为每种语言建立独立列表 (Add a verified channel by appending one item with both locales; do not create per-locale lists)。
 */
export const contacts: readonly ContactLink[] = [
  {
    id: "github",
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
