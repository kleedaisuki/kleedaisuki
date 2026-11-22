import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { renderArt } from "./art.ts";

/* Crawlers want PNG; everything else is written as SVG. Run from the repository root. */
const SHARE_CARD = "public/social-card.svg";

const art = renderArt();
for (const [path, svg] of art) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, svg);
}

await copyFile(
  fileURLToPath(import.meta.resolve("@moesegfault/style/icons/brand.svg")),
  "public/favicon.svg",
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`<style>body{margin:0}svg{display:block}</style>${art.get(SHARE_CARD)}`);
await page.screenshot({ path: SHARE_CARD.replace(".svg", ".png") });
await browser.close();

process.stdout.write(`Wrote ${art.size} drawings\n`);
