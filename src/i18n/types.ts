/** @brief 站点支持的语言标识 (Supported site locale identifiers)。 */
export type Locale = "zh" | "en";

/** @brief 可公开索引的页面标识 (Publicly indexable page identifiers)。 */
export type PageId = "home" | "uses" | "now" | "projects" | "contact";

/** @brief 单个页面的搜索与分享元数据 (Search and sharing metadata for one page)。 */
export interface PageMetadata {
  /** @brief 页面标题 (Page title)。 */
  title: string;
  /** @brief 页面摘要 (Page description)。 */
  description: string;
}

/** @brief 全站文案的强类型契约 (Strongly typed contract for site-wide copy)。 */
export interface Messages {
  /** @brief 品牌与身份文案 (Brand and identity copy)。 */
  brand: {
    name: string;
    siteName: string;
    tagline: string;
    homeLabel: string;
  };
  /** @brief 页面搜索与分享元数据 (Page search and sharing metadata)。 */
  meta: Record<PageId, PageMetadata>;
  /** @brief 一级导航文案 (Primary navigation copy)。 */
  nav: Record<PageId, string>;
  /** @brief 全站通用界面文案 (Shared user-interface copy)。 */
  common: {
    skipToContent: string;
    primaryNavigation: string;
    languageSwitcher: string;
    switchLanguage: string;
    themeToggle: string;
    switchToLight: string;
    switchToDark: string;
    lightTheme: string;
    darkTheme: string;
    builtWith: string;
    updated: string;
    visit: string;
    readMore: string;
  };
  /** @brief 首页专用文案 (Home-page copy)。 */
  home: {
    eyebrow: string;
    greeting: string;
    headline: string;
    introduction: string;
    profileLabel: string;
    exploreLabel: string;
    blogTitle: string;
    blogDescription: string;
    botTitle: string;
    botDescription: string;
  };
  /** @brief Uses 页面辅助文案 (Uses-page supporting copy)。 */
  uses: {
    eyebrow: string;
    intro: string;
  };
  /** @brief Now 页面辅助文案 (Now-page supporting copy)。 */
  now: {
    eyebrow: string;
    intro: string;
  };
  /** @brief Projects 页面文案 (Projects-page copy)。 */
  projects: {
    eyebrow: string;
    intro: string;
    sourceLabel: string;
    sourceLive: string;
    sourceFallback: string;
    repository: string;
    homepage: string;
    stars: string;
    forks: string;
    updatedAt: string;
    archived: string;
  };
  /** @brief Contact 页面文案 (Contact-page copy)。 */
  contact: {
    eyebrow: string;
    intro: string;
    preferred: string;
    openLink: string;
  };
  /** @brief 未找到页面文案 (Not-found page copy)。 */
  notFound: {
    title: string;
    description: string;
    action: string;
  };
}

/** @brief 语言的人类可读元数据 (Human-readable locale metadata)。 */
export interface LocaleMetadata {
  /** @brief 站内语言标识 (Internal locale identifier)。 */
  id: Locale;
  /** @brief BCP 47 语言标签 (BCP 47 language tag)。 */
  languageTag: string;
  /** @brief Open Graph 语言标签 (Open Graph locale tag)。 */
  openGraphLocale: string;
  /** @brief 以该语言显示的语言名称 (Locale name written in that locale)。 */
  label: string;
  /** @brief HTML 文本方向 (HTML text direction)。 */
  direction: "ltr" | "rtl";
}

/** @brief hreflang 替代地址项 (hreflang alternate URL entry)。 */
export interface AlternateUrl {
  /** @brief 语言替代关系值 (Language-alternate relation value)。 */
  hreflang: string;
  /** @brief 绝对页面地址 (Absolute page URL)。 */
  href: string;
}
