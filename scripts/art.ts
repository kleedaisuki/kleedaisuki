import { tokens } from "@moesegfault/style";
import { type Cell, cellsToPath, place, type Tone, tonePaths } from "../src/pixel/cell.ts";
import { CORE_HEART, faceOnly, type Mood } from "../src/pixel/core.ts";
import { ditherPath, threshold } from "../src/pixel/dither.ts";
import { ICON_SIZE, iconMarks, pixelIcon } from "../src/pixel/icons.ts";
import { type Scene, scenes } from "../src/pixel/scene.ts";
import { setType } from "../src/pixel/typeface.ts";

/*
 * Static art for places that cannot run the site's CSS: the GitHub profile README and the share
 * card. Text is drawn in the pixel typeface because SVG images cannot load web fonts.
 */

const ink = tokens["color.leather-950"];
const snow = tokens["color.snow-50"];
const honey = tokens["color.honey-200"];

const palette: Readonly<Record<Tone, string>> = {
  moe: honey,
  name: snow,
  rim: tokens["color.honey-500"],
  shell: tokens["color.honey-300"],
  plate: tokens["color.snow-100"],
  ink,
  blush: tokens["color.klee-300"],
  leaf: tokens["color.clover-300"],
  vein: tokens["color.clover-500"],
};

interface Ground {
  readonly brand: string;
  readonly dots: string;
}

const grounds = {
  light: { brand: tokens["color.klee-600"], dots: tokens["color.klee-700"] },
  dark: { brand: tokens["color.klee-800"], dots: tokens["color.leather-900"] },
} as const satisfies Record<string, Ground>;

function paint(cells: readonly Cell[]): string {
  return tonePaths(cells)
    .map(({ tone, d }) => `<path fill="${palette[tone]}" d="${d}"/>`)
    .join("");
}

/** One line of pixel type; `unit` is the size of its pixel in the surrounding coordinates. */
function label(text: string, x: number, y: number, unit: number, fill: string): string {
  const d = cellsToPath(setType(text, "name").cells, 1);
  return `<path fill="${fill}" transform="translate(${x} ${y}) scale(${unit})" d="${d}"/>`;
}

/** The dithered halo the site paints on canvas, on a coarser lattice. */
function halo(scene: Scene, columns: number, rows: number, left: number, top: number): string {
  const heart = { x: left + scene.core.column + CORE_HEART.x, y: top + CORE_HEART.y };
  let path = "";
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const distance = Math.hypot(column + 0.5 - heart.x, row + 0.5 - heart.y);
      const glow = 0.9 * Math.max(0, 1 - distance / 52) ** 2;
      if (glow >= threshold(column, row)) path += `M${column}.4 ${row}.4h.2v.2h-.2z`;
    }
  }
  return path;
}

/** Deterministic scatter: the same art on every machine. */
function hash(column: number, row: number): number {
  let value = Math.imul(column + 11, 0x9e3779b1) ^ Math.imul(row + 7, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 15), 0xc2b2ae35);
  return ((value ^ (value >>> 13)) >>> 0) / 2 ** 32;
}

const SECTORS = 14;
const SHELLS = 3;

/** A core dump played backwards: pixels grouped by heading fly home and stay. */
function assemble(scene: Scene): string {
  const heart = { x: scene.core.column + CORE_HEART.x, y: scene.core.row + CORE_HEART.y };
  const groups = new Map<number, Cell[]>();
  for (const cell of scene.cells) {
    const angle = Math.atan2(cell.row + 0.5 - heart.y, cell.column + 0.5 - heart.x);
    const sector = Math.floor(((angle / (2 * Math.PI) + 1) % 1) * SECTORS);
    const shell = Math.floor(hash(cell.column, cell.row) * SHELLS);
    const key = sector * SHELLS + shell;
    groups.set(key, [...(groups.get(key) ?? []), cell]);
  }
  return [...groups]
    .sort(([left], [right]) => left - right)
    .map(([key, cells]) => {
      const heading = ((Math.floor(key / SHELLS) + 0.5) / SECTORS) * 2 * Math.PI;
      const reach = 9 + 8 * (key % SHELLS);
      const x = (Math.cos(heading) * reach).toFixed(1);
      const y = (Math.sin(heading) * reach).toFixed(1);
      const delay = (key % SHELLS) * 90;
      return `<g class="p" style="--x:${x}px;--y:${y}px;animation-delay:${delay}ms">${paint(cells)}</g>`;
    })
    .join("");
}

function face(scene: Scene, mood: Mood, className: string): string {
  return `<g class="${className}">${paint(place(faceOnly(mood), scene.core.column, scene.core.row))}</g>`;
}

const motion = `
.f{opacity:0}
@media (prefers-reduced-motion:no-preference){
.p{animation:home 1.1s cubic-bezier(.3,1.25,.4,1) backwards}
.calm{animation:wait 2.8s step-end backwards}
.dizzy{animation:show 1.2s step-end}
.glad{animation:show 1.6s 1.2s step-end}
@keyframes home{from{transform:translate(var(--x),var(--y));opacity:0}}
@keyframes wait{from{opacity:0}to{opacity:1}}
@keyframes show{from{opacity:1}to{opacity:0}}
}`.replaceAll("\n", "");

const UNIT = 12;
const EDGE_ROWS = 20;
const EDGE_PIXEL = 0.5;
/** Overlap that hides the antialiased joint between the solid field and its edge. */
const SEAM = 0.08;

/** Its lower edge dissolves into whatever page it sits on, so it needs no background of its own. */
function banner(ground: Ground): string {
  const scene = scenes.banner;
  const left = 5;
  const top = 4;
  const columns = scene.columns + 2 * left;
  const solid = top + scene.rows + 2;
  const rows = solid + EDGE_ROWS * EDGE_PIXEL;
  /* The edge path is dense at the bottom; flipped, crimson is dense at the top. */
  const edge = `<pattern id="e" width="8" height="${EDGE_ROWS}" patternUnits="userSpaceOnUse"><path fill="${ground.brand}" transform="translate(0 ${EDGE_ROWS}) scale(1 -1)" d="${ditherPath(8, EDGE_ROWS)}"/></pattern>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${rows}" width="${columns * UNIT}" height="${rows * UNIT}" role="img" aria-labelledby="t">`,
    `<title id="t">moeSegFault: Segmentation fault (core dumped)</title>`,
    `<style>${motion}</style><defs>${edge}</defs>`,
    `<path fill="${ground.brand}" d="M0 1a1 1 0 0 1 1-1h${columns - 2}a1 1 0 0 1 1 1v${solid - 1 + SEAM}H0z"/>`,
    `<rect width="${columns / EDGE_PIXEL}" height="${EDGE_ROWS}" fill="url(#e)" shape-rendering="crispEdges" transform="translate(0 ${solid}) scale(${EDGE_PIXEL})"/>`,
    `<path fill="${ground.dots}" d="${halo(scene, columns, solid, left, top)}"/>`,
    label("$ ./me", left, top + 2, 0.36, honey),
    label("Segmentation fault (core dumped)", left, top + 6.5, 0.36, snow),
    `<g transform="translate(${left} ${top})">${assemble(scene)}`,
    face(scene, "dizzy", "f dizzy"),
    face(scene, "glad", "f glad"),
    face(scene, "calm", "calm"),
    "</g></svg>\n",
  ].join("");
}

function icon(mark: string): string {
  const size = ICON_SIZE * 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}" width="${size}" height="${size}" aria-hidden="true">${paint(pixelIcon(mark) ?? [])}</svg>\n`;
}

/** A link drawn as a control; both colorways hold on light and dark pages. */
function linkButton(text: string, fill: string, color: string): string {
  const unit = 2;
  const width = setType(text, "name").width * unit + 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 40" width="${width}" height="40" role="img" aria-label="${text}"><rect width="${width}" height="40" rx="6" fill="${fill}"/>${label(text, 16, 13, unit, color)}</svg>\n`;
}

function shareCard(): string {
  const scene = scenes.wide;
  const { brand, dots } = grounds.light;
  const unit = 16.5;
  const columns = 1200 / unit;
  const rows = 630 / unit;
  const left = (columns - scene.columns) / 2;
  const top = rows - scene.rows - 1;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="t">`,
    `<title id="t">moeSegFault</title><rect width="1200" height="630" fill="${brand}"/>`,
    `<g transform="scale(${unit})"><path fill="${dots}" d="${halo(scene, Math.ceil(columns), Math.ceil(rows), left, top)}"/>`,
    `<g transform="translate(${left} ${top})">${paint([...scene.cells, ...place(faceOnly("calm"), scene.core.column, scene.core.row)])}</g></g>`,
    label("$ ./me", left * unit, 96, 5, honey),
    label("Segmentation fault", left * unit, 170, 5, snow),
    label("(core dumped)", left * unit, 226, 5, snow),
    label("me.moesegfault.dev", left * unit, 320, 3, honey),
    "</svg>\n",
  ].join("");
}

const crimson = tokens["color.klee-600"];

/** Every generated file by repository path. */
export function renderArt(): ReadonlyMap<string, string> {
  return new Map([
    ["assets/profile/banner-light.svg", banner(grounds.light)],
    ["assets/profile/banner-dark.svg", banner(grounds.dark)],
    ...iconMarks.map((mark, index) => [`assets/profile/frame-${index}.svg`, icon(mark)] as const),
    ["assets/profile/link-me.svg", linkButton("me", crimson, snow)],
    ["assets/profile/link-atelier.svg", linkButton("atelier", honey, ink)],
    ["assets/profile/link-bot.svg", linkButton("bot", honey, ink)],
    ["public/social-card.svg", shareCard()],
  ]);
}
