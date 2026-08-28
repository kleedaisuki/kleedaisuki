import type { Locale } from "../i18n";
import type { GitHubProject } from "../lib/github";

/** @brief 项目页面与卡片的本地化辅助文案 (Localized supporting copy for the projects page and cards)。 */
export interface ProjectCopy {
  /** @brief 页面标题 (Page title)。 */
  title: string;
  /** @brief GitHub 完整目录链接文案 (GitHub full-directory link label)。 */
  viewAll: string;
  /** @brief GitHub 项目列表的无障碍标签 (Accessible label for the GitHub project list)。 */
  listLabel: string;
  /** @brief 离线快照状态说明 (Offline-snapshot status message)。 */
  fallbackNotice: string;
  /** @brief 无项目简介时的替代文案 (Fallback copy when a project has no description)。 */
  missingDescription: string;
  /** @brief 项目主题列表的无障碍标签 (Accessible label for project topics)。 */
  topicsLabel: string;
}

/** @brief 中英文项目辅助文案 (Chinese and English project supporting copy)。 */
export const PROJECT_COPY = {
  zh: {
    title: "项目",
    viewAll: "在 GitHub 查看全部",
    listLabel: "GitHub 项目列表",
    fallbackNotice: "GitHub 暂时没有返回完整目录；当前展示离线项目快照，下一次构建会自动重新同步。",
    missingDescription: "这个项目正在安静地生长，简介稍后补完。",
    topicsLabel: "项目主题",
  },
  en: {
    title: "Projects",
    viewAll: "View all on GitHub",
    listLabel: "GitHub project list",
    fallbackNotice:
      "GitHub did not return the full catalog, so this build is showing the offline project snapshot. The next build will try to sync again.",
    missingDescription: "This project is quietly taking shape. A description is coming soon.",
    topicsLabel: "Project topics",
  },
} as const satisfies Record<Locale, ProjectCopy>;

/** @brief 人工维护的中文项目简介覆盖 (Human-maintained Chinese project-description overrides)。 */
const ZH_DESCRIPTION_OVERRIDES: Readonly<Record<string, string>> = {
  cinder:
    "一个小巧的 CUDA C++ 运行时：提供稳定的 C ABI 与 Python FFI 绑定，直接运行原生内核，不依赖扩展魔法。",
  "mini-core-bank": "用于练习领域驱动设计、会计流程、银行卡、信贷与投资建模的微型核心银行系统。",
  "jacobi-svd-cuda-opt": "基于 CUDA 与 libcu++ 的单边 Jacobi（Hestenes）奇异值分解实现。",
  "isa-compare-lab": "一个使用汇编与 QEMU 比较 ARM 和 RISC-V 指令集架构的最小实验框架。",
  "histo-patch-cls": "一个最小化、配置驱动且可复现的 PyTorch 组织病理学图像块分类流水线。",
};

/** @brief 可直接渲染的本地化项目简介 (Localized project description ready for rendering)。 */
export interface LocalizedProjectDescription {
  /** @brief 简介文本 (Description text)。 */
  text: string;
  /** @brief 文本语言；与页面语言一致时省略 (Text language, omitted when it matches the page locale)。 */
  lang?: string;
}

/**
 * @brief 解析项目简介及其语言标注 (Resolve a project description and its language annotation)。
 * @param project GitHub 项目事实数据 (GitHub project facts)。
 * @param locale 当前页面语言 (Current page locale)。
 * @return 本地化简介以及必要的 BCP 47 语言标签 (Localized description and an optional BCP 47 language tag)。
 * @note 中文页面优先使用人工译文；未覆盖的英文 GitHub 简介会显式标记 lang="en"，帮助浏览器与辅助技术正确处理 (Chinese pages prefer human translations; uncovered English GitHub descriptions are explicitly marked lang="en" for browsers and assistive technology)。
 */
export function localizeProjectDescription(
  project: GitHubProject,
  locale: Locale,
): LocalizedProjectDescription {
  /** @brief 当前语言的无简介替代文案 (Locale-specific missing-description copy)。 */
  const fallback = PROJECT_COPY[locale].missingDescription;
  if (!project.description) return { text: fallback };

  if (locale === "zh") {
    /** @brief 当前项目的人工中文简介 (Human-authored Chinese description for this project)。 */
    const override = ZH_DESCRIPTION_OVERRIDES[project.name];
    if (override) return { text: override };

    /** @brief GitHub 简介是否已包含汉字 (Whether the GitHub description already contains Han characters)。 */
    const containsHan = /\p{Script=Han}/u.test(project.description);
    return containsHan ? { text: project.description } : { text: project.description, lang: "en" };
  }

  return { text: project.description };
}
