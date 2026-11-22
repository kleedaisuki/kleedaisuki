import type { GitHubProject } from "./github";

export interface ProjectMonth {
  /** Calendar month as `YYYY-MM`, in UTC like the timestamps it comes from. */
  readonly month: string;
  readonly projects: readonly GitHubProject[];
}

/** Groups consecutive projects by month; the directory is already newest first. */
export function groupByMonth(projects: readonly GitHubProject[]): readonly ProjectMonth[] {
  const months = new Map<string, GitHubProject[]>();
  for (const project of projects) {
    const month = project.updatedAt.slice(0, 7);
    const group = months.get(month) ?? [];
    group.push(project);
    months.set(month, group);
  }
  return [...months].map(([month, group]) => ({ month, projects: group }));
}

export interface LanguageCount {
  readonly language: string;
  readonly count: number;
}

export function countLanguages(projects: readonly GitHubProject[]): readonly LanguageCount[] {
  const counts = new Map<string, number>();
  for (const { language } of projects) {
    if (language) counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts]
    .map(([language, count]) => ({ language, count }))
    .sort((left, right) => right.count - left.count || left.language.localeCompare(right.language));
}

/** Language families share a palette hue; the design system has no others to offer. */
const FAMILIES: Readonly<Record<string, readonly string[]>> = {
  "var(--moe-color-klee-500)": ["C", "C++", "Cuda", "Assembly"],
  "var(--moe-color-flame-500)": ["Rust", "Go", "Zig"],
  "var(--moe-color-honey-500)": ["Python", "Jupyter Notebook"],
  "var(--moe-color-clover-500)": ["Java", "C#", "Kotlin"],
  "var(--moe-color-flame-400)": ["TypeScript", "JavaScript", "Astro", "HTML", "CSS", "PHP"],
};

const hues = new Map(
  Object.entries(FAMILIES).flatMap(([hue, languages]) =>
    languages.map((language) => [language, hue] as const),
  ),
);

export function languageHue(language: string | null): string {
  return (language && hues.get(language)) || "var(--moe-color-leather-300)";
}
