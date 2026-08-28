import { defineConfig, devices } from "@playwright/test";

/** @brief 本地预览服务器地址 (Local preview-server URL)。 */
const baseURL = "http://127.0.0.1:4341";

/**
 * @brief 微信 Android 风格的用户代理，仅用于近似回归 (WeChat-like Android user agent for approximate regression only)。
 * @note 此配置不是微信真机或其完整 WebView 的替代品 (This is not a substitute for a real WeChat device or its complete WebView)。
 */
const wechatAndroidUserAgent =
  "Mozilla/5.0 (Linux; Android 15; Pixel 8 Build/AP4A.250205.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.58";

/**
 * @brief 微信 iOS 风格的用户代理，仅用于近似回归 (WeChat-like iOS user agent for approximate regression only)。
 * @note Playwright 的 Chromium 模拟不等同于 WKWebView 真机行为 (Playwright Chromium emulation is not equivalent to real-device WKWebView behavior)。
 */
const wechatIosUserAgent =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.58 NetType/WIFI Language/zh_CN";

/** @brief 跨浏览器与移动端端到端测试配置 (Cross-browser and mobile end-to-end test configuration)。 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./node_modules/.cache/playwright/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 2 } : {}),
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "./node_modules/.cache/playwright/report" }],
      ]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1 --port 4341",
    env: { ASTRO_PREVIEW_BACKGROUND: "0" },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
    {
      name: "wechat-like-android-emulation",
      use: {
        browserName: "chromium",
        viewport: { width: 393, height: 873 },
        deviceScaleFactor: 2.75,
        hasTouch: true,
        isMobile: true,
        locale: "zh-CN",
        userAgent: wechatAndroidUserAgent,
      },
    },
    {
      name: "wechat-like-ios-emulation",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        locale: "zh-CN",
        userAgent: wechatIosUserAgent,
      },
    },
  ],
});
