import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/** @brief 生产站点的规范基准地址 (Canonical base URL of the production site)。 */
const siteUrl = "https://me.moesegfault.dev";

/** @brief 需要逐页验证的本地化路由 (Localized routes that require page-level verification)。 */
const routes = [
  { locale: "zh-CN", path: "/" },
  { locale: "zh-CN", path: "/uses/" },
  { locale: "zh-CN", path: "/now/" },
  { locale: "zh-CN", path: "/projects/" },
  { locale: "zh-CN", path: "/contact/" },
  { locale: "en-US", path: "/en/" },
  { locale: "en-US", path: "/en/uses/" },
  { locale: "en-US", path: "/en/now/" },
  { locale: "en-US", path: "/en/projects/" },
  { locale: "en-US", path: "/en/contact/" },
];

/** @brief 两种语言共享的页面段 (Page segments shared by both locales)。 */
const pageSegments = ["", "uses", "now", "projects", "contact"];

/**
 * @brief 计算路由对应的构建文件路径 (Resolve the built file path for a route)。
 * @param {string} outputDir 构建输出目录 (Build output directory)。
 * @param {string} pathname 站点路由 (Site route)。
 * @return {string} index.html 的文件路径 (File path to index.html)。
 */
function routeFile(outputDir, pathname) {
  return join(outputDir, ...pathname.split("/").filter(Boolean), "index.html");
}

/**
 * @brief 统计 HTML 起始标签出现次数 (Count occurrences of an HTML opening tag)。
 * @param {string} html HTML 文档 (HTML document)。
 * @param {string} tag 标签名 (Tag name)。
 * @return {number} 起始标签数量 (Number of opening tags)。
 */
function countOpeningTags(html, tag) {
  return html.match(new RegExp(`<${tag}(?:\\s|>)`, "gi"))?.length ?? 0;
}

/**
 * @brief 提取指定 link rel 的 href (Extract href values for a link relation)。
 * @param {string} html HTML 文档 (HTML document)。
 * @param {string} relation rel 属性值 (rel attribute value)。
 * @return {string[]} 匹配的 href 列表 (Matching href values)。
 */
function linkHrefs(html, relation) {
  /** @brief 文档中的所有 link 起始标签 (All link opening tags in the document)。 */
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  return links.flatMap((link) => {
    /** @brief 当前标签的 rel 关系集合 (Relation values of the current tag)。 */
    const rel = link.match(/\brel=["']([^"']+)["']/i)?.[1]?.split(/\s+/) ?? [];
    /** @brief 当前标签的链接地址 (Link destination of the current tag)。 */
    const href = link.match(/\bhref=["']([^"']+)["']/i)?.[1];
    return rel.includes(relation) && href ? [href] : [];
  });
}

/**
 * @brief 提取 hreflang 到 href 的映射 (Extract the hreflang-to-href mapping)。
 * @param {string} html HTML 文档 (HTML document)。
 * @return {Map<string, string>} 语言替代链接映射 (Language-alternate link map)。
 */
function alternateHrefs(html) {
  /** @brief 文档中的所有 link 起始标签 (All link opening tags in the document)。 */
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  /** @brief 提取出的语言与地址对 (Extracted language and URL pairs)。 */
  const pairs = links.flatMap((link) => {
    /** @brief 当前标签的 rel 关系集合 (Relation values of the current tag)。 */
    const rel = link.match(/\brel=["']([^"']+)["']/i)?.[1]?.split(/\s+/) ?? [];
    /** @brief 当前标签声明的语言 (Language declared by the current tag)。 */
    const language = link.match(/\bhreflang=["']([^"']+)["']/i)?.[1];
    /** @brief 当前标签的链接地址 (Link destination of the current tag)。 */
    const href = link.match(/\bhref=["']([^"']+)["']/i)?.[1];
    return rel.includes("alternate") && language && href ? [[language, href]] : [];
  });
  return new Map(pairs);
}

/**
 * @brief 将 HTML 约化为可见文本以检查品牌签名 (Reduce HTML to visible text for brand-signature checks)。
 * @param {string} html HTML 文档 (HTML document)。
 * @return {string} 归一化可见文本 (Normalized visible text)。
 */
function visibleText(html) {
  return html
    .replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(?:x[\da-f]+|\d+);|&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @brief 从站点路由推导无语言前缀的页面段 (Derive a locale-free page segment from a route)。
 * @param {string} pathname 站点路由 (Site route)。
 * @return {string} 页面段或空字符串 (Page segment or an empty string)。
 */
function pageSegment(pathname) {
  return (
    pathname
      .replace(/^\/en(?=\/|$)/, "")
      .split("/")
      .filter(Boolean)[0] ?? ""
  );
}

/**
 * @brief 为同一内容生成完整语言替代集合 (Build the complete language-alternate set for the same content)。
 * @param {string} segment 无语言前缀页面段 (Locale-free page segment)。
 * @return {Map<string, string>} 预期替代链接 (Expected alternate links)。
 */
function expectedAlternates(segment) {
  const suffix = segment ? `${segment}/` : "";
  return new Map([
    ["zh-CN", `${siteUrl}/${suffix}`],
    ["en-US", `${siteUrl}/en/${suffix}`],
    ["x-default", `${siteUrl}/${suffix}`],
  ]);
}

/**
 * @brief 读取输出目录中的所有 sitemap XML (Read every sitemap XML in the output directory)。
 * @param {string} outputDir 构建输出目录 (Build output directory)。
 * @return {Promise<string>} 合并后的 sitemap 文本 (Combined sitemap text)。
 */
async function readSitemaps(outputDir) {
  /** @brief 输出目录中的 sitemap 文件名 (Sitemap file names in the output directory)。 */
  const names = (await readdir(outputDir)).filter(
    (name) => name.startsWith("sitemap") && name.endsWith(".xml"),
  );
  assert.ok(names.length > 0, "No sitemap XML files were generated");
  return (await Promise.all(names.map((name) => readFile(join(outputDir, name), "utf8")))).join(
    "\n",
  );
}

/**
 * @brief 验证构建产物中的页面与发现入口 (Verify pages and discovery endpoints in the build output)。
 * @param {string} outputDir 构建输出目录 (Build output directory)。
 * @return {Promise<void>} 验证成功时无返回值 (No return value after successful verification)。
 */
async function verify(outputDir) {
  for (const route of routes) {
    /** @brief 当前路由的 HTML 构建产物 (Built HTML for the current route)。 */
    const html = await readFile(routeFile(outputDir, route.path), "utf8");
    /** @brief 当前路由应声明的规范地址 (Expected canonical URL for the current route)。 */
    const canonical = `${siteUrl}${route.path}`;
    /** @brief 当前路由的可见文本 (Visible text of the current route)。 */
    const text = visibleText(html);

    assert.equal(countOpeningTags(html, "main"), 1, `${route.path} must contain exactly one main`);
    assert.equal(countOpeningTags(html, "h1"), 1, `${route.path} must contain exactly one h1`);
    assert.match(
      html,
      new RegExp(`<html\\b[^>]*\\blang=["']${route.locale}["']`, "i"),
      `${route.path} must declare html lang=${route.locale}`,
    );
    assert.deepEqual(
      linkHrefs(html, "canonical"),
      [canonical],
      `${route.path} needs one self canonical`,
    );

    /** @brief 当前路由声明的语言替代链接 (Language alternates declared by the current route)。 */
    const alternates = alternateHrefs(html);
    assert.deepEqual(
      [...alternates.entries()].sort(),
      [...expectedAlternates(pageSegment(route.path)).entries()].sort(),
      `${route.path} needs reciprocal zh-CN, en-US, and x-default alternates`,
    );
    assert.match(text, /MoeSegFault/i, `${route.path} must show the MoeSegFault brand`);
    assert.doesNotMatch(
      text,
      /(^|[^\p{L}\p{N}_])Klee(?=$|[^\p{L}\p{N}_])/iu,
      `${route.path} must not expose Klee as a visible brand name`,
    );

    /** @brief 当前路由的语言前缀 (Locale prefix for the current route)。 */
    const localizedPrefix = route.locale === "en-US" ? "/en" : "";
    for (const segment of pageSegments) {
      /** @brief 当前导航项应使用的本地化路径 (Expected localized path for the current navigation item)。 */
      const expectedPath = segment ? `${localizedPrefix}/${segment}/` : `${localizedPrefix || ""}/`;
      assert.match(
        html,
        new RegExp(`href=["']${expectedPath.replaceAll("/", "\\/")}["']`, "i"),
        `${route.path} must link to ${expectedPath}`,
      );
    }
  }

  for (const pathname of ["/", "/en/"]) {
    /** @brief 当前首页的 HTML 构建产物 (Built HTML for the current home page)。 */
    const html = await readFile(routeFile(outputDir, pathname), "utf8");
    /** Maintainer-only deployment text must never leak into the public profile. */
    assert.doesNotMatch(
      visibleText(html),
      /Cloudflare Workers 部署|CLOUDFLARE_API_TOKEN|pnpm install --frozen-lockfile/iu,
      `${pathname} must not render maintainer deployment instructions`,
    );
    for (const href of [
      "https://github.com/kleedaisuki",
      "https://atelier.moesegfault.dev",
      "https://bot.moesegfault.dev",
    ]) {
      assert.ok(html.includes(`href="${href}"`), `${pathname} must link to ${href}`);
    }
  }

  /** @brief 站点级发现文件与 sitemap 内容 (Site-wide discovery files and sitemap content)。 */
  const [robots, llms, outputFiles, sitemap] = await Promise.all([
    readFile(join(outputDir, "robots.txt"), "utf8"),
    readFile(join(outputDir, "llms.txt"), "utf8"),
    readdir(outputDir),
    readSitemaps(outputDir),
  ]);

  assert.match(robots, /User-agent:\s*\*/i, "robots.txt must address general crawlers");
  assert.match(robots, /Allow:\s*\//i, "robots.txt must allow the site");
  assert.ok(
    robots.includes(`${siteUrl}/sitemap-index.xml`),
    "robots.txt must advertise the sitemap index",
  );
  assert.ok(
    !outputFiles.includes("CNAME"),
    "Cloudflare assets must not include the GitHub Pages CNAME file",
  );
  assert.match(llms, /experimental/iu, "llms.txt must identify its experimental status");
  assert.match(
    llms,
    /not (?:an? )?(?:official )?Web standard/iu,
    "llms.txt must not claim standard status",
  );

  for (const route of routes) {
    /** @brief 当前路由应出现在索引中的规范地址 (Canonical URL expected in discovery indexes)。 */
    const canonical = `${siteUrl}${route.path}`;
    assert.ok(sitemap.includes(canonical), `Sitemap must include ${canonical}`);
    assert.ok(llms.includes(canonical), `llms.txt must include ${canonical}`);
  }

  for (const href of [
    "https://github.com/kleedaisuki",
    "https://atelier.moesegfault.dev",
    "https://bot.moesegfault.dev",
    "https://github.com/kleedaisuki/kleedaisuki/blob/main/README.md",
    "https://github.com/kleedaisuki/kleedaisuki/blob/main/docs/uses.md",
    "https://github.com/kleedaisuki/kleedaisuki/blob/main/docs/now.md",
  ]) {
    assert.ok(llms.includes(href), `llms.txt must include ${href}`);
  }

  process.stdout.write(
    `Verified ${routes.length} localized routes and discovery artifacts in ${outputDir}\n`,
  );
}

/** @brief 命令行指定或默认的构建输出目录 (CLI-provided or default build output directory)。 */
const outputDir = resolve(process.argv[2] ?? "dist");
await verify(outputDir);
