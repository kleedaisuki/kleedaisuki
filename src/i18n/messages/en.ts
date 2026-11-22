import type { Messages } from "../types";

/** @brief 英文站点文案 (English site messages)。 */
export const en = {
  brand: {
    name: "moeSegFault",
    siteName: "moeSegFault · me",
    tagline: "Turning ideas into reliable, delightful systems.",
    homeLabel: "moeSegFault's personal home",
  },
  meta: {
    home: {
      title: "Home",
      description:
        "moeSegFault's personal home for software systems, research, open source, and a little bit of moe.",
    },
    uses: {
      title: "Uses",
      description: "The hardware, software, and development tools moeSegFault uses every day.",
    },
    now: {
      title: "Now",
      description: "What moeSegFault is currently exploring, learning, and building.",
    },
    projects: {
      title: "Projects",
      description: "moeSegFault's open-source projects, systems experiments, and growing ideas.",
    },
    contact: {
      title: "Contact",
      description: "Reach moeSegFault and explore public tools and platforms.",
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
    updated: "Updated",
    visit: "Visit",
    readMore: "Read more",
  },
  home: {
    headline: "I turn sparks of thought into worlds that run.",
    introduction:
      "Exploring the edges of software systems, parallel computing, and machine learning—measuring performance while asking how technology should live with people.",
    githubProfileLabel: "Public GitHub profile",
    githubLive: "Live GitHub profile",
    githubSnapshot: "Build-time snapshot",
    repositories: "Public repos",
    followers: "Followers",
    following: "Following",
    segfaultAction: "Send SIGSEGV to Core",
    segfaultRecovered: "recovered",
    profileLabel: "Identity fragments",
    exploreLabel: "Choose a path",
    blogTitle: "Blog",
    botTitle: "FOGMOE Bot",
  },
  projects: {
    sourceFallback: "Local snapshot",
    repository: "View repository",
    homepage: "Visit project",
    stars: "Stars",
    forks: "Forks",
    updatedAt: "Last updated",
    archived: "Archived",
  },
  contact: {
    preferred: "Preferred",
    openLink: "Open contact method",
    channelsTitle: "Channels",
    platformsTitle: "Public platforms",
    openPlatform: "Visit platform",
  },
  notFound: {
    title: "There is no page here yet",
    description: "The address may be mistyped, or this little page planet has not formed yet.",
    action: "Back home",
  },
} satisfies Messages;
