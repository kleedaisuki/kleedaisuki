import { type Blast, glowAt, type Grain } from "./blast.ts";
import { CELL_FILL, type Tone } from "./cell.ts";
import { CORE_HEART } from "./core.ts";
import { threshold } from "./dither.ts";

/** Maps cells to device pixels. */
export interface View {
  width: number;
  height: number;
  unit: number;
  left: number;
  top: number;
}

const extras = ["hot", "spark", "glow", "ground"] as const;
const tones = [
  "moe",
  "name",
  "rim",
  "shell",
  "plate",
  "ink",
  "blush",
  "leaf",
  "vein",
] as const satisfies readonly Tone[];

export type Palette = Record<Tone | (typeof extras)[number], string>;

export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const entries = [...tones, ...extras].map((name) => [
    name,
    style.getPropertyValue(`--px-${name}`).trim(),
  ]);
  return Object.fromEntries(entries) as Palette;
}

/** Light is drawn on a lattice twice as fine as the cells. */
const DOT = 0.5;
const HALO = 44;

function eachDot(view: View, visit: (x: number, y: number, column: number, row: number) => void) {
  const pitch = view.unit * DOT;
  const columns = Math.ceil(view.width / pitch);
  const rows = Math.ceil(view.height / pitch);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = (column + 0.5) * DOT - view.left / view.unit;
      const y = (row + 0.5) * DOT - view.top / view.unit;
      visit(x, y, column, row);
    }
  }
}

function dot(
  context: CanvasRenderingContext2D,
  view: View,
  column: number,
  row: number,
  share: number,
) {
  const pitch = view.unit * DOT;
  const side = Math.max(1, Math.round(pitch * share));
  const inset = (pitch - side) / 2;
  context.fillRect(Math.round(column * pitch + inset), Math.round(row * pitch + inset), side, side);
}

/** The resting ground: a dithered halo around Core. */
export function paintGround(
  context: CanvasRenderingContext2D,
  blast: Blast,
  view: View,
  palette: Palette,
): void {
  const { column, row } = blast.scene.core;
  const heart = { x: column + CORE_HEART.x, y: row + CORE_HEART.y };
  context.clearRect(0, 0, view.width, view.height);
  context.fillStyle = palette.ground;
  eachDot(view, (x, y, dotColumn, dotRow) => {
    const glow = 0.8 * Math.max(0, 1 - Math.hypot(x - heart.x, y - heart.y) / HALO) ** 2;
    if (glow >= threshold(dotColumn, dotRow)) dot(context, view, dotColumn, dotRow, 0.34);
  });
}

/** Firelight uses four colors only; dithering supplies what lies between. */
function paintGlow(
  context: CanvasRenderingContext2D,
  blast: Blast,
  view: View,
  palette: Palette,
): void {
  if (blast.shocks.length === 0) return;
  const ramp = [palette.glow, palette.spark, palette.moe, palette.hot];
  eachDot(view, (x, y, column, row) => {
    const light = blast.shocks.reduce((sum, shock) => Math.max(sum, glowAt(shock, x, y)), 0);
    const level = Math.floor(Math.min(1, light) * ramp.length + threshold(column, row)) - 1;
    if (level < 0) return;
    context.fillStyle = ramp[Math.min(level, ramp.length - 1)] as string;
    dot(context, view, column, row, 0.8);
  });
}

function paintGrain(
  context: CanvasRenderingContext2D,
  grain: Grain,
  view: View,
  palette: Palette,
): void {
  const side = CELL_FILL * view.unit;
  const cos = Math.cos(grain.angle);
  const sin = Math.sin(grain.angle);
  const x = view.left + grain.x * view.unit;
  const y = view.top + grain.y * view.unit;
  context.setTransform(cos, sin, -sin, cos, x, y);
  context.globalAlpha = 1;
  context.fillStyle = palette[grain.tone];
  context.fillRect(-side / 2, -side / 2, side, side);
  if (grain.heat === 0) return;
  context.globalAlpha = Math.min(1, grain.heat);
  context.fillStyle = palette.hot;
  context.fillRect(-side / 2, -side / 2, side, side);
}

function paintSparks(
  context: CanvasRenderingContext2D,
  blast: Blast,
  view: View,
  palette: Palette,
): void {
  for (const spark of blast.sparks) {
    const side = DOT * view.unit * Math.min(1, spark.life * 3);
    context.fillStyle = spark.life > 0.5 ? palette.hot : palette.moe;
    context.fillRect(
      view.left + spark.x * view.unit - side / 2,
      view.top + spark.y * view.unit - side / 2,
      side,
      side,
    );
  }
}

export function paintBlast(
  context: CanvasRenderingContext2D,
  ground: CanvasImageSource,
  blast: Blast,
  view: View,
  palette: Palette,
): void {
  const shake = Math.round(blast.shake * 0.3 * view.unit * (2 * Math.random() - 1));
  const shaken = { ...view, left: view.left + shake, top: view.top - shake };
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, view.width, view.height);
  context.drawImage(ground, 0, 0);
  paintGlow(context, blast, view, palette);
  for (const grain of blast.grains) paintGrain(context, grain, shaken, palette);
  context.globalAlpha = 1;
  context.setTransform(1, 0, 0, 1, 0, 0);
  paintSparks(context, blast, shaken, palette);
}
