import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderArt } from "../scripts/art.ts";
import {
  advance,
  addressOf,
  type Blast,
  createBlast,
  detonate,
  express,
  isStill,
  isWhole,
} from "../src/pixel/blast.ts";
import { CORE_HEART, FACE_CELLS, faceCells, type Mood } from "../src/pixel/core.ts";
import { threshold } from "../src/pixel/dither.ts";
import { scenes } from "../src/pixel/scene.ts";
import { setType } from "../src/pixel/typeface.ts";

function run(blast: Blast, seconds: number, rate: number): void {
  for (let frame = 0; frame < seconds * rate; frame++) advance(blast, 1 / rate);
}

function dumped(): Blast {
  const blast = createBlast(scenes.wide);
  const { column, row } = scenes.wide.core;
  detonate(blast, column + CORE_HEART.x, row + CORE_HEART.y, 1.6);
  return blast;
}

const snapshot = (blast: Blast): number[] => blast.grains.flatMap(({ x, y }) => [x, y]);

test("a core dump converges exactly to the drawing it came from", () => {
  const rest = snapshot(createBlast(scenes.wide));
  const blast = dumped();
  run(blast, 0.5, 60);
  assert.ok(!isWhole(blast));
  run(blast, 8, 60);
  assert.ok(isStill(blast));
  assert.deepEqual(snapshot(blast), rest);
});

test("the simulation does not depend on the refresh rate", () => {
  const slow = dumped();
  const fast = dumped();
  run(slow, 0.5, 30);
  run(fast, 0.5, 120);
  const drift = snapshot(slow).map((value, at) => Math.abs(value - (snapshot(fast)[at] ?? 0)));
  assert.ok(Math.max(...drift) < 0.5);
});

test("a long pause advances by one bounded step", () => {
  const blast = dumped();
  advance(blast, 3600);
  assert.ok(blast.shocks.every(({ age }) => age < 0.1));
});

test("every expression uses the same number of pixels and stays on the plate", () => {
  for (const mood of ["calm", "wince", "dizzy", "glad", "starry", "keen", "wink"] as Mood[]) {
    const cells = faceCells(mood);
    assert.equal(cells.length, FACE_CELLS);
    for (const { column, row } of cells) {
      assert.ok(column >= 4 && column <= 16 && row >= 13 && row <= 20, `${mood} ${column},${row}`);
    }
  }
});

test("a new expression settles on its own pixels", () => {
  const blast = createBlast(scenes.tall);
  express(blast, "glad", 1, 0);
  run(blast, 4, 60);
  const { column } = scenes.tall.core;
  assert.deepEqual(
    blast.face.map(({ x }) => x),
    faceCells("glad").map((cell) => cell.column + column + 1.5),
  );
});

test("scenes keep every cell inside their bounds", () => {
  for (const [name, { cells, columns, rows }] of Object.entries(scenes)) {
    const inside = cells.every(
      ({ column, row }) => column >= 0 && row >= 0 && column < columns && row < rows,
    );
    assert.ok(inside, name);
  }
});

test("fault addresses are clamped to the scene", () => {
  assert.equal(addressOf(scenes.wide, -5, -5), "0x0000");
  const last = scenes.wide.columns * scenes.wide.rows - 1;
  assert.equal(addressOf(scenes.wide, 1e6, 1e6), `0x${last.toString(16).padStart(4, "0")}`);
});

test("dithering preserves tone and the typeface refuses unknown letters", () => {
  const values = Array.from({ length: 64 }, (_, at) => threshold(at % 8, Math.floor(at / 8)));
  assert.equal(new Set(values).size, 64);
  assert.equal(values.reduce((sum, value) => sum + value, 0) / 64, 0.5);
  assert.throws(() => setType("é", "name"), /no glyph/);
});

test("committed art matches its generator; run `pnpm art` after changing pixels", async () => {
  for (const [path, svg] of renderArt()) {
    const committed = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
    assert.equal(committed, svg, path);
  }
});

test("profile art needs nothing GitHub would block", () => {
  for (const [path, svg] of renderArt()) {
    assert.doesNotMatch(svg, /<script|<foreignObject|href=|url\((?!#)/, path);
  }
});
