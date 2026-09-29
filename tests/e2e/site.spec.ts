import { expect, type Locator, type Page, test } from "@playwright/test";

/** @brief 站点支持的页面路径标识 (Supported site page path identifiers)。 */
type PageSlug = "" | "uses" | "now" | "projects" | "contact";

/** @brief 双语页面对 (Bilingual page pair)。 */
interface RoutePair {
  /** @brief 页面路径标识 (Page path identifier)。 */
  slug: PageSlug;
  /** @brief 中文页面路径 (Chinese page path)。 */
  zh: string;
  /** @brief 英文页面路径 (English page path)。 */
  en: string;
}

/** @brief 五组共十个可索引双语路由 (Five pairs comprising ten indexable bilingual routes)。 */
const routePairs: readonly RoutePair[] = [
  { slug: "", zh: "/", en: "/en/" },
  { slug: "uses", zh: "/uses/", en: "/en/uses/" },
  { slug: "now", zh: "/now/", en: "/en/now/" },
  { slug: "projects", zh: "/projects/", en: "/en/projects/" },
  { slug: "contact", zh: "/contact/", en: "/en/contact/" },
] as const;

/** @brief 首页响应式回归视口 (Responsive home-page regression viewports)。 */
const homeViewports = [
  { name: "320px", width: 320, height: 700 },
  { name: "375px", width: 375, height: 812 },
  { name: "mobile-landscape", width: 844, height: 390 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** @brief 浏览器动态 GitHub 请求使用的确定性测试资料 (Deterministic profile used by mocked browser-side GitHub requests)。 */
const liveGitHubProfile = {
  login: "kleedaisuki",
  name: "MoeSegFault Live",
  avatar_url: "https://avatars.githubusercontent.com/u/189504231?v=4",
  html_url: "https://github.com/kleedaisuki",
  bio: "Dynamically refreshed profile",
  company: "Live Systems Lab",
  blog: "https://me.moesegfault.dev",
  location: "Tianjin, China",
  public_repos: 47,
  followers: 11,
  following: 5,
  created_at: "2024-11-24T05:57:43Z",
} as const;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/github/profile", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", json: liveGitHubProfile });
  });
});

/**
 * @brief 验证当前文档的核心静态页面不变量 (Verify core static-page invariants for the current document)。
 * @param page Playwright 页面对象 (Playwright page object)。
 * @param languageTag 预期 HTML 语言标签 (Expected HTML language tag)。
 * @return 完成验证的异步任务 (Promise completed after verification)。
 */
async function expectStaticPage(page: Page, languageTag: "zh-CN" | "en-US"): Promise<void> {
  /** @brief 页面主内容区域 (Page main-content region)。 */
  const main = page.locator("main");
  await expect(main).toHaveCount(1);
  await expect(main).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("html")).toHaveAttribute("lang", languageTag);

  /** @brief 文档水平方向溢出的像素差 (Document horizontal-overflow delta in pixels)。 */
  const overflow = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth,
    ),
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

/**
 * @brief 导航页面并验证 HTTP 与静态内容 (Navigate to a page and verify HTTP and static content)。
 * @param page Playwright 页面对象 (Playwright page object)。
 * @param path 站内绝对路径 (Site-absolute path)。
 * @param languageTag 预期 HTML 语言标签 (Expected HTML language tag)。
 * @return 完成验证的异步任务 (Promise completed after verification)。
 */
async function visitAndVerify(
  page: Page,
  path: string,
  languageTag: "zh-CN" | "en-US",
): Promise<void> {
  /** @brief 主文档导航响应 (Main-document navigation response)。 */
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response, `Expected an HTTP response for ${path}`).not.toBeNull();
  /** @brief HTTP 状态码，允许浏览器缓存产生的 304 (HTTP status, allowing browser-cache 304 responses)。 */
  const status = response?.status() ?? 0;
  expect([200, 304]).toContain(status);
  await expectStaticPage(page, languageTag);
}

/**
 * @brief 验证触控目标的最小可达尺寸 (Verify the minimum reachable size of a touch target)。
 * @param locator 待验证的元素定位器 (Locator for the element to verify)。
 * @return 完成验证的异步任务 (Promise completed after verification)。
 */
async function expectTouchTarget(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  /** @brief 元素的布局边界 (Element layout bounds)。 */
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(43);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(43);
}

for (const route of routePairs) {
  test(`${route.slug || "home"}: both locales render and language switch preserves the page`, async ({
    page,
  }) => {
    await visitAndVerify(page, route.zh, "zh-CN");

    /** @brief 中文页上的语言切换链接 (Language-switch link on the Chinese page)。 */
    const switchToEnglish = page.locator("a.language-switch");
    await expect(switchToEnglish).toHaveAttribute("href", route.en);
    await switchToEnglish.click();
    await expect(page).toHaveURL(new RegExp(`${route.en.replaceAll("/", "\\/")}$`));
    await expectStaticPage(page, "en-US");

    /** @brief 英文页上的语言切换链接 (Language-switch link on the English page)。 */
    const switchToChinese = page.locator("a.language-switch");
    await expect(switchToChinese).toHaveAttribute("href", route.zh);
    await switchToChinese.click();
    await expect(page).toHaveURL(new RegExp(`${route.zh.replaceAll("/", "\\/")}$`));
    await expectStaticPage(page, "zh-CN");

    await visitAndVerify(page, route.en, "en-US");
  });
}

test("Worker API rejects unsupported methods and unknown API routes", async ({ request }) => {
  /** @brief 资料端点仅接受 GET (The profile endpoint accepts only GET)。 */
  const unsupportedMethod = await request.post("/api/github/profile");
  expect(unsupportedMethod.status()).toBe(405);
  expect(unsupportedMethod.headers().allow).toBe("GET");

  /** @brief 未定义的 API 路径不能回退为 HTML 页面 (Unknown API paths must not fall back to HTML)。 */
  const unknownRoute = await request.get("/api/not-a-route");
  expect(unknownRoute.status()).toBe(404);
  expect(unknownRoute.headers()["content-type"]).toMatch(/application\/json/i);
});

test("primary navigation and controls remain touch-reachable", async ({ page }) => {
  await visitAndVerify(page, "/", "zh-CN");

  /** @brief 一级导航链接 (Primary navigation links)。 */
  const links = page.locator("nav.site-nav a");
  expect(await links.count()).toBe(5);
  for (const link of await links.all()) await expectTouchTarget(link);
  await expectTouchTarget(page.locator("a.language-switch"));
  await expectTouchTarget(page.locator("button[data-theme-toggle]"));
});

test("blog entry points use the Atelier domain", async ({ page }) => {
  await visitAndVerify(page, "/", "zh-CN");
  await expect(page.locator("a.destination--blog")).toHaveAttribute(
    "href",
    "https://atelier.moesegfault.dev",
  );

  await visitAndVerify(page, "/contact/", "zh-CN");
  /** @brief 联系页的 Atelier 博客入口 (Atelier blog entry point on the contact page)。 */
  const blogContact = page.locator('[data-channel="blog"]');
  await expect(blogContact).toHaveAttribute("href", "https://atelier.moesegfault.dev/");
  await expect(blogContact.locator(".address")).toHaveText("atelier.moesegfault.dev");
});

test("home upgrades its static GitHub profile with live browser data", async ({ page }) => {
  for (const path of ["/", "/en/"] as const) {
    /** @brief 首次访问必须查询本站 Worker 端点；同一会话的第二页可命中浏览器缓存 (The first visit must use the same-origin Worker endpoint; the second may reuse the browser session cache)。 */
    const profileRequest =
      path === "/"
        ? page.waitForRequest((request) => request.url().endsWith("/api/github/profile"))
        : null;
    await page.goto(path, { waitUntil: "domcontentloaded" });
    if (profileRequest) {
      const request = await profileRequest;
      expect(new URL(request.url()).origin).toBe(new URL(page.url()).origin);
    }
    /** @brief 由静态基线升级的 GitHub 资料卡 (GitHub profile card upgraded from its static baseline)。 */
    const profile = page.locator(".github-profile");
    await expect(profile).toBeVisible();
    await expect(profile).toHaveAttribute("data-profile-state", "live");
    await expect(profile.locator("[data-profile-name]")).toHaveText("MoeSegFault Live");
    await expect(profile.locator('[data-profile-stat="repositories"]')).toHaveText("47");
    /** @brief 不应被状态圆点样式压缩的资料来源标签 (Profile-source label that must not inherit the status-dot sizing)。 */
    const sourceLabel = profile.locator("[data-profile-source-label]");
    await expect(sourceLabel).toBeVisible();
    expect(
      await sourceLabel.evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(1);
    await expect(profile.locator("img.github-profile__avatar")).toHaveAttribute(
      "src",
      /avatars\.githubusercontent\.com/,
    );
    await expect(profile.getByRole("link", { name: /@kleedaisuki/ })).toHaveAttribute(
      "href",
      "https://github.com/kleedaisuki",
    );
    await expect(profile.locator(".github-profile__stats > div")).toHaveCount(3);
  }
});

test("home falls back to public GitHub REST when the Worker is rate limited", async ({ page }) => {
  /** A shared edge quota must not suppress the pre-existing browser enhancement. */
  await page.route("**/api/github/profile", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      json: { error: "Limited" },
    });
  });
  let directRequests = 0;
  await page.route("https://api.github.com/users/kleedaisuki", async (route) => {
    directRequests += 1;
    await route.fulfill({ status: 200, contentType: "application/json", json: liveGitHubProfile });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const profile = page.locator(".github-profile");
  await expect(profile).toHaveAttribute("data-profile-state", "live");
  await expect(profile.locator("[data-profile-name]")).toHaveText("MoeSegFault Live");
  expect(directRequests).toBe(1);
});

test("home does not query cross-origin GitHub REST when the Worker succeeds", async ({ page }) => {
  let directRequests = 0;
  await page.route("https://api.github.com/users/kleedaisuki", async (route) => {
    directRequests += 1;
    await route.abort("failed");
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".github-profile")).toHaveAttribute("data-profile-state", "live");
  expect(directRequests).toBe(0);
});

test("home keeps the build-time GitHub profile when the live request fails", async ({ page }) => {
  await page.route("**/api/github/profile", async (route) => {
    await route.abort("failed");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  /** @brief 动态失败后仍包含构建期内容的资料卡 (Profile card retaining build-time content after a dynamic failure)。 */
  const profile = page.locator(".github-profile");
  await page.waitForFunction(() => {
    /** @brief 当前 GitHub 资料卡 (Current GitHub profile card)。 */
    const card = document.querySelector<HTMLElement>(".github-profile");
    return card?.dataset.profileState === "static" && card.getAttribute("aria-busy") === "false";
  });
  await expect(profile.locator("[data-profile-name]")).not.toBeEmpty();
  await expect(profile.locator('[data-profile-stat="repositories"]')).not.toBeEmpty();
  await expect(profile.locator("[data-profile-source-label]")).toHaveText("构建期快照");
});

test("home restores its static state when a live avatar cannot load", async ({ page }) => {
  /** @brief 用于覆盖预加载路径的不可用头像地址 (Unavailable avatar URL used to exercise the preload path)。 */
  const unavailableAvatar = "https://avatars.githubusercontent.com/u/profile-refresh-test";
  await page.route("**/api/github/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: { ...liveGitHubProfile, avatar_url: unavailableAvatar },
    });
  });
  await page.route(unavailableAvatar, async (route) => {
    await route.abort("failed");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => {
    /** @brief 当前 GitHub 资料卡 (Current GitHub profile card)。 */
    const card = document.querySelector<HTMLElement>(".github-profile");
    return card?.dataset.profileState === "static" && card.getAttribute("aria-busy") === "false";
  });
  await expect(page.locator("[data-profile-name]")).not.toHaveText("MoeSegFault Live");
  await expect(page.locator("[data-profile-source-label]")).toHaveText("构建期快照");
});

for (const viewport of homeViewports) {
  test(`home has a content-sized layout at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await visitAndVerify(page, "/", "zh-CN");

    /** @brief 首页关键区域的布局几何信息 (Layout geometry for key home-page regions)。 */
    const geometry = await page.evaluate(() => {
      /** @brief 页面主内容区域 (Main page region)。 */
      const main = document.querySelector("main");
      /** @brief 首页主视觉区域 (Home hero region)。 */
      const hero = document.querySelector(".home-hero");
      /** @brief 首页个人资料区域 (Home profile region)。 */
      const profile = document.querySelector(".home-profile");
      if (!(main && hero && profile)) return null;
      /** @brief 主内容边界 (Main-content bounds)。 */
      const mainBox = main.getBoundingClientRect();
      /** @brief 主视觉边界 (Hero bounds)。 */
      const heroBox = hero.getBoundingClientRect();
      /** @brief 个人资料边界 (Profile bounds)。 */
      const profileBox = profile.getBoundingClientRect();
      return {
        mainTop: mainBox.top,
        heroTop: heroBox.top,
        heroHeight: heroBox.height,
        profileTop: profileBox.top,
        documentHeight: document.documentElement.scrollHeight,
      };
    });

    expect(geometry).not.toBeNull();
    expect(geometry?.heroHeight ?? 0).toBeGreaterThan(120);
    expect((geometry?.heroTop ?? 0) - (geometry?.mainTop ?? 0)).toBeLessThan(180);
    expect(
      (geometry?.profileTop ?? 0) - ((geometry?.heroTop ?? 0) + (geometry?.heroHeight ?? 0)),
    ).toBeLessThan(Math.max(180, viewport.height * 0.45));
    expect(geometry?.documentHeight ?? 0).toBeLessThan(20_000);
  });
}

test("theme toggle updates and persists the selected theme", async ({ page }) => {
  await visitAndVerify(page, "/", "zh-CN");

  /** @brief 初始页面主题 (Initial document theme)。 */
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  expect(["light", "dark"]).toContain(initialTheme);

  /** @brief 主题切换按钮 (Theme-toggle button)。 */
  const toggle = page.locator("button[data-theme-toggle]");
  await toggle.click();
  /** @brief 用户切换后的页面主题 (Document theme after the user toggle)。 */
  const selectedTheme = initialTheme === "dark" ? "light" : "dark";
  await expect(page.locator("html")).toHaveAttribute("data-theme", selectedTheme);
  await expect(toggle).toHaveAttribute("aria-pressed", String(selectedTheme === "dark"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", selectedTheme);
});

test("Uses and Now render as semantic showcases instead of article columns", async ({ page }) => {
  await visitAndVerify(page, "/uses/", "zh-CN");
  await expect(page.locator('.showcase[data-variant="toolkit"]')).toBeVisible();
  await expect(page.locator(".showcase-section")).toHaveCount(10);
  await expect(page.locator(".showcase-section h2")).toHaveCount(10);

  await visitAndVerify(page, "/now/", "zh-CN");
  await expect(page.locator('.showcase[data-variant="pulse"]')).toBeVisible();
  await expect(page.locator(".showcase-section")).toHaveCount(4);
  await expect(page.locator(".showcase-section h2")).toHaveCount(4);
  await expect(page.locator(".showcase-item h3")).toHaveCount(6);
});

test("reduced-motion preference keeps every showcase section immediately visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await visitAndVerify(page, "/now/", "zh-CN");

  /** @brief 减少动态效果时的全部显现区块 (All reveal regions with reduced motion enabled)。 */
  const revealRegions = page.locator("[data-reveal]");
  expect(await revealRegions.count()).toBeGreaterThan(1);
  await expect(page.locator("html")).not.toHaveClass(/motion-ready/);
  for (const region of await revealRegions.all()) await expect(region).toBeVisible();
});

test("bilingual 404 language switch returns to an existing localized home", async ({ page }) => {
  await page.goto("/404.html");
  await expect(page.locator(".language-switch")).toHaveAttribute("href", "/en/");
});
