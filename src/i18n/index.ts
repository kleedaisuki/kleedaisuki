import { SITE } from "../config/site";
import { en } from "./messages/en";
import { zh } from "./messages/zh";
import type { AlternateUrl, Locale, LocaleMetadata, Messages, PageId } from "./types";

export type { AlternateUrl, Locale, LocaleMetadata, Messages, PageId } from "./types";

/** @brief 默认站点语言 (Default site locale)。 */
export const defaultLocale: Locale = "zh";

/** @brief 支持语言的稳定顺序 (Stable order of supported locales)。 */
export const locales = ["zh", "en"] as const satisfies readonly Locale[];

/** @brief 各语言的人类可读元数据 (Human-readable metadata for every locale)。 */
export const localeMetadata = {
  zh: {
    id: "zh",
    languageTag: "zh-CN",
    openGraphLocale: "zh_CN",
    label: "简体中文",
    direction: "ltr",
  },
  en: {
    id: "en",
    languageTag: "en-US",
    openGraphLocale: "en_US",
    label: "English",
    direction: "ltr",
  },
} as const satisfies Record<Locale, LocaleMetadata>;

/** @brief 站点的强类型双语文案 (Strongly typed bilingual site messages)。 */
export const messages = { zh, en } as const satisfies Record<Locale, Messages>;

/** @brief 页面标识到无语言前缀路径段的映射 (Map from page IDs to locale-free path segments)。 */
const pageSegments = {
  home: "",
  uses: "uses",
  now: "now",
  projects: "projects",
  contact: "contact",
} as const satisfies Record<PageId, string>;

/**
 * @brief 判断未知值是否为受支持的语言 (Check whether an unknown value is a supported locale)。
 * @param value 待检查的值 (Value to inspect)。
 * @return 是否为受支持语言 (Whether the value is a supported locale)。
 */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * @brief 从地址路径解析当前语言 (Resolve the active locale from a URL path)。
 * @param input URL 对象或路径字符串 (URL object or pathname string)。
 * @return 解析出的语言，根路由默认为中文 (Resolved locale; root routes default to Chinese)。
 */
export function localeFromUrl(input: URL | string): Locale {
  const pathname = input instanceof URL ? input.pathname : input;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return firstSegment === "en" ? "en" : defaultLocale;
}

/**
 * @brief 取得指定语言的文案对象 (Get the message catalog for a locale)。
 * @param locale 目标语言 (Target locale)。
 * @return 对应的强类型文案 (Corresponding strongly typed messages)。
 */
export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

/**
 * @brief 生成本地化页面路径 (Build a localized page path)。
 * @param page 页面标识 (Page identifier)。
 * @param locale 目标语言 (Target locale)。
 * @return 以斜杠结尾的站内绝对路径 (Root-relative path with a trailing slash)。
 */
export function pagePath(page: PageId, locale: Locale = defaultLocale): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const segment = pageSegments[page];
  return segment ? `${prefix}/${segment}/` : `${prefix || ""}/`;
}

/**
 * @brief 生成本地化页面的规范绝对地址 (Build a canonical absolute URL for a localized page)。
 * @param page 页面标识 (Page identifier)。
 * @param locale 目标语言 (Target locale)。
 * @param base 站点基准地址 (Site base URL)。
 * @return 页面绝对地址字符串 (Absolute page URL string)。
 */
export function pageUrl(
  page: PageId,
  locale: Locale = defaultLocale,
  base: string | URL = SITE.url,
): string {
  return new URL(pagePath(page, locale), base).toString();
}

/**
 * @brief 生成页面的 hreflang 与默认替代地址 (Build hreflang and default alternate URLs for a page)。
 * @param page 页面标识 (Page identifier)。
 * @param base 站点基准地址 (Site base URL)。
 * @return 包含双语及 x-default 的替代地址 (Alternates for both locales plus x-default)。
 */
export function alternateUrls(page: PageId, base: string | URL = SITE.url): AlternateUrl[] {
  const localized = locales.map((locale) => ({
    hreflang: localeMetadata[locale].languageTag,
    href: pageUrl(page, locale, base),
  }));

  return [...localized, { hreflang: "x-default", href: pageUrl(page, defaultLocale, base) }];
}

/**
 * @brief 返回另一种语言 (Return the other supported locale)。
 * @param locale 当前语言 (Current locale)。
 * @return 可切换到的语言 (Locale to switch to)。
 */
export function alternateLocale(locale: Locale): Locale {
  return locale === "zh" ? "en" : "zh";
}
