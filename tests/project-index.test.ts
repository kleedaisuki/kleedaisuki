import assert from "node:assert/strict";
import test from "node:test";
import { PROJECT_FALLBACK } from "../src/data/project-fallback.ts";
import { countLanguages, groupByMonth, languageHue } from "../src/lib/project-index.ts";

test("months keep newest-first order and lose no project", () => {
  const months = groupByMonth(PROJECT_FALLBACK);
  assert.deepEqual(
    months.map(({ month }) => month),
    ["2026-06", "2026-05", "2026-04"],
  );
  assert.deepEqual(
    months.flatMap(({ projects }) => projects),
    [...PROJECT_FALLBACK],
  );
});

test("languages are tallied by frequency and always have a hue", () => {
  assert.deepEqual(countLanguages(PROJECT_FALLBACK)[0], { language: "Cuda", count: 2 });
  for (const language of ["C++", "Brainfuck", null]) {
    assert.match(languageHue(language), /^var\(--moe-color-/);
  }
});
