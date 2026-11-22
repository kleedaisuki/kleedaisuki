import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseIdentity } from "../src/lib/identity.ts";
import { pixelIcon } from "../src/pixel/icons.ts";

const read = (path: string): Promise<string> =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("both profile languages hold the same six drawn fragments", async () => {
  const zh = parseIdentity(await read("src/content/profile/zh.md"));
  const translation = await read("src/content/translations/profile.md");
  const en = parseIdentity(translation.replace(/^---.*?---/s, ""));

  assert.equal(zh.length, 6);
  assert.deepEqual(
    en.map(({ mark }) => mark),
    zh.map(({ mark }) => mark),
  );
  for (const { quote, mark, roles } of [...zh, ...en]) {
    assert.ok(quote.length > 0);
    assert.doesNotMatch(quote, /\*\*/);
    assert.equal(roles.length, 3);
    assert.ok(pixelIcon(mark), `${mark} needs a pixel icon`);
  }
});

test("a malformed fragment fails instead of vanishing", () => {
  assert.throws(() => parseIdentity("> just a line"), /Not an identity fragment/);
});

test("the profile README repeats every fragment verbatim", async () => {
  const readme = await read("README.md");
  for (const { quote, roles } of parseIdentity(await read("src/content/profile/zh.md"))) {
    assert.ok(readme.includes(quote), quote);
    assert.ok(readme.includes(roles.join(" / ")), roles.join(" / "));
  }
});
