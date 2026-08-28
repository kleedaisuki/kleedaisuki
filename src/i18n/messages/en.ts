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
    eyebrow: "Hello, Internet",
    greeting: "Hi, I'm MoeSegFault.",
    headline: "I turn ideas into systems.",
    introduction:
      "I care about software systems, parallel computing, machine learning, and the relationship between technology and people.",
    profileLabel: "About MoeSegFault",
    exploreLabel: "Keep exploring",
    blogTitle: "Blog",
    blogDescription: "Long-form engineering notes, research thoughts, and occasional life updates.",
    botTitle: "FOGMOE Bot",
    botDescription: "A doorway to the FOGMOE community bot.",
  },
  uses: { eyebrow: "Tools and environment" },
  now: { eyebrow: "In progress" },
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
