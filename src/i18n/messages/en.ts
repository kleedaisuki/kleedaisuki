import type { Messages } from "../types";

/** @brief 英文站点文案 (English site messages)。 */
export const en = {
  brand: {
    name: "MoeSegFault",
    siteName: "MoeSegFault · me",
    tagline: "Turning ideas into reliable, delightful systems.",
    homeLabel: "MoeSegFault's personal home",
  },
  meta: {
    home: {
      title: "Home",
      description:
        "MoeSegFault's personal home for software systems, research, open source, and a little bit of moe.",
    },
    uses: {
      title: "Uses",
      description: "The hardware, software, and development tools MoeSegFault uses every day.",
    },
    now: {
      title: "Now",
      description: "What MoeSegFault is currently exploring, learning, and building.",
    },
    projects: {
      title: "Projects",
      description: "MoeSegFault's open-source projects, systems experiments, and growing ideas.",
    },
    contact: {
      title: "Contact",
      description: "Public channels and community identities for reaching MoeSegFault.",
    },
  },
  nav: { home: "Home", uses: "Uses", now: "Now", projects: "Projects", contact: "Contact" },
  common: {
    skipToContent: "Skip to content",
    primaryNavigation: "Primary navigation",
    languageSwitcher: "Language selector",
    switchLanguage: "切换至简体中文",
    themeToggle: "Toggle color theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    builtWith: "Built with Astro",
    updated: "Updated",
    visit: "Visit",
    readMore: "Read more",
  },
  home: {
    eyebrow: "Signal connected",
    greeting: "This is MoeSegFault.",
    headline: "I turn sparks of thought into worlds that run.",
    introduction:
      "Exploring the edges of software systems, parallel computing, and machine learning—measuring performance while asking how technology should live with people.",
    profileLabel: "Identity fragments",
    exploreLabel: "Choose a path",
    blogTitle: "Blog",
    blogDescription:
      "Engineering notes, research fragments, and the occasional life update escaping the main thread.",
    botTitle: "FOGMOE Bot",
    botDescription: "The live doorway to FOGMOE—and an agent experiment still taking shape.",
  },
  uses: {
    eyebrow: "Everyday loadout",
    intro: "A living snapshot of the tools I build, measure, and think with.",
  },
  now: {
    eyebrow: "Current coordinates",
    intro: "Not a complete log—just the systems, questions, and directions taking shape right now.",
  },
  projects: {
    eyebrow: "Open source and experiments",
    intro: "Public GitHub projects, ordered by their most recent update.",
    sourceLabel: "Project data source",
    sourceLive: "Live GitHub data",
    sourceFallback: "Local snapshot",
    repository: "View repository",
    homepage: "Visit project",
    stars: "Stars",
    forks: "Forks",
    updatedAt: "Last updated",
    archived: "Archived",
  },
  contact: {
    eyebrow: "Stay in touch",
    intro: "Choose the channel that suits you. This data-driven list can grow over time.",
    preferred: "Preferred",
    openLink: "Open contact method",
  },
  notFound: {
    title: "There is no page here yet",
    description: "The address may be mistyped, or this little page planet has not formed yet.",
    action: "Back home",
  },
} satisfies Messages;
