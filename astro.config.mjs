import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

/**
 * @brief Astro 站点配置 (Astro site configuration)。
 * @note 自定义域名部署在根路径，因此不设置 base (The custom-domain site is deployed at the root, so no base path is needed)。
 */
export default defineConfig({
  site: "https://me.moesegfault.dev",
  output: "static",
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "zh",
        locales: {
          zh: "zh-CN",
          en: "en-US",
        },
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
});
