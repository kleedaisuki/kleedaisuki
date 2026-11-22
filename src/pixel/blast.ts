import type { Cell, Tone } from "./cell.ts";
import { faceCells, type Mood } from "./core.ts";
import type { Scene } from "./scene.ts";

/*
 * The core dump as a pure simulation: no DOM, no clock, reproducible randomness.
 * Lengths are cells and times are seconds. Every grain is a damped spring around a home that may
 * move, so blasts, gaze, and changes of expression are one mechanism.
 */

/** A fixed step makes the outcome independent of the refresh rate. */
export const STEP = 1 / 120;
/** The most one frame may catch up, so a returning background tab never teleports. */
const CATCH_UP = 0.05;

const STIFFNESS = 110;
const FRICTION = 13;
const GRAVITY = 24;
const DRAG = 2.1;
const COOLING = 2.4;
const KICK = 29;
const KICK_REACH = 11;
const PULL = 460;
const STIR_REACH = 3.2;
const STIR_LIMIT = 55;
const QUARTER = Math.PI / 2;

export const SHOCK_SPEED = 52;
/** Afterglow left behind the ring: how far it carries and how long it lasts. */
const GLOW_REACH = 17;
const GLOW_TIME = 0.22;
const GLOW_FLOOR = 0.04;

export interface Grain {
  readonly tone: Tone;
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  heat: number;
  /** Remaining free flight; the spring takes over at zero. */
  loose: number;
  /** Torn off by a shock, so it can glint on return. */
  torn: boolean;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface Shock {
  readonly x: number;
  readonly y: number;
  readonly power: number;
  age: number;
}

export interface Blast {
  readonly scene: Scene;
  readonly grains: readonly Grain[];
  /** The tail of `grains` that draws Core's face. */
  readonly face: readonly Grain[];
  readonly random: () => number;
  sparks: Spark[];
  shocks: Shock[];
  charge: { x: number; y: number; level: number } | undefined;
  shake: number;
  lag: number;
}

/** mulberry32: one word of state and uniform enough. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32;
  };
}

function grainAt({ column, row, tone }: Cell): Grain {
  const x = column + 0.5;
  const y = row + 0.5;
  return {
    tone,
    homeX: x,
    homeY: y,
    x,
    y,
    vx: 0,
    vy: 0,
    angle: 0,
    spin: 0,
    heat: 0,
    loose: 0,
    torn: false,
  };
}

export function createBlast(scene: Scene, seed = 11): Blast {
  const body = scene.cells.map(grainAt);
  const face = faceCells("calm").map(grainAt);
  const blast: Blast = {
    scene,
    grains: [...body, ...face],
    face,
    random: seeded(seed),
    sparks: [],
    shocks: [],
    charge: undefined,
    shake: 0,
    lag: 0,
  };
  express(blast, "calm", 0, 0);
  for (const grain of face) settle(grain);
  return blast;
}

/** Moves the homes of the face grains; their springs draw the change. */
export function express(blast: Blast, mood: Mood, gazeX: number, gazeY: number): void {
  const { column, row } = blast.scene.core;
  for (const [index, cell] of faceCells(mood).entries()) {
    const grain = blast.face[index] as Grain;
    grain.homeX = column + cell.column + 0.5 + gazeX;
    grain.homeY = row + cell.row + 0.5 + gazeY;
  }
}

export function detonate(blast: Blast, x: number, y: number, power: number): void {
  blast.charge = undefined;
  blast.shake = power;
  blast.shocks.push({ x, y, power, age: 0 });
  const count = Math.round(20 + 28 * power);
  for (let index = 0; index < count; index++) {
    const heading = blast.random() * 2 * Math.PI;
    const speed = (14 + 36 * blast.random()) * Math.sqrt(power);
    blast.sparks.push({
      x,
      y,
      vx: Math.cos(heading) * speed,
      vy: Math.sin(heading) * speed - 8,
      life: 0.5 + 0.9 * blast.random(),
    });
  }
}

/** The pointer passes like wind, nudging near grains. */
export function stir(blast: Blast, x: number, y: number, vx: number, vy: number): void {
  const limit = Math.min(1, STIR_LIMIT / (Math.hypot(vx, vy) || 1));
  for (const grain of blast.grains) {
    const distance = Math.hypot(grain.x - x, grain.y - y);
    if (distance > STIR_REACH) continue;
    const share = 0.2 * limit * (1 - distance / STIR_REACH);
    grain.vx += vx * share;
    grain.vy += vy * share;
  }
}

export function beginCharge(blast: Blast, x: number, y: number): void {
  blast.charge = { x, y, level: 0 };
}

function kick(blast: Blast, grain: Grain, shock: Shock): void {
  const ax = grain.x - shock.x;
  const ay = grain.y - shock.y;
  const distance = Math.hypot(ax, ay) || 0.01;
  const force = shock.power * Math.exp(-distance / KICK_REACH);
  const speed = KICK * force * (0.75 + 0.5 * blast.random());
  grain.vx += (ax / distance) * speed;
  grain.vy += (ay / distance) * speed - 4 * force;
  grain.spin += (blast.random() - 0.5) * 22 * force;
  grain.loose = Math.min(0.75, (0.12 + 0.45 * blast.random()) * Math.sqrt(force));
  grain.heat = Math.max(grain.heat, Math.min(1, force * 1.4));
  grain.torn ||= force > 0.2;
}

/** A shock acts on a grain in the one step its ring sweeps past. */
function advanceShock(blast: Blast, shock: Shock): void {
  const inner = shock.age * SHOCK_SPEED;
  shock.age += STEP;
  const outer = shock.age * SHOCK_SPEED;
  for (const grain of blast.grains) {
    const distance = Math.hypot(grain.homeX - shock.x, grain.homeY - shock.y);
    if (distance >= inner && distance < outer) kick(blast, grain, shock);
  }
}

/** Light at a point: carried by the ring, fading with distance and with time since it passed. */
export function glowAt(shock: Shock, x: number, y: number): number {
  const distance = Math.hypot(x - shock.x, y - shock.y);
  const since = shock.age - distance / SHOCK_SPEED;
  if (since < 0) return 0;
  return shock.power * Math.exp(-distance / GLOW_REACH - since / GLOW_TIME);
}

function isSpent(shock: Shock, scene: Scene): boolean {
  const swept = shock.age * SHOCK_SPEED > scene.columns + scene.rows;
  return swept && shock.power * Math.exp(-shock.age / GLOW_TIME) < GLOW_FLOOR;
}

/** Draw inward before the blast: anticipation, as animators call it. */
function implode(grain: Grain, charge: NonNullable<Blast["charge"]>, random: () => number): void {
  const ax = charge.x - grain.x;
  const ay = charge.y - grain.y;
  const distance = Math.hypot(ax, ay) || 0.01;
  const reach = charge.level * Math.exp(-distance / 7);
  const pull = PULL * reach * Math.min(1, distance);
  const tremble = 260 * charge.level * reach;
  grain.vx += ((ax / distance) * pull + (random() - 0.5) * tremble) * STEP;
  grain.vy += ((ay / distance) * pull + (random() - 0.5) * tremble) * STEP;
}

function pull(grain: Grain): void {
  if (grain.loose > 0) {
    grain.loose -= STEP;
    const drag = Math.exp(-DRAG * STEP);
    grain.vx *= drag;
    grain.vy = grain.vy * drag + GRAVITY * STEP;
    return;
  }
  grain.vx += (STIFFNESS * (grain.homeX - grain.x) - FRICTION * grain.vx) * STEP;
  grain.vy += (STIFFNESS * (grain.homeY - grain.y) - FRICTION * grain.vy) * STEP;
  /* A square repeats every quarter turn, so it settles on the nearest. */
  const rest = Math.round(grain.angle / QUARTER) * QUARTER;
  grain.spin += (STIFFNESS * (rest - grain.angle) - FRICTION * grain.spin) * STEP;
}

function advanceGrain(blast: Blast, grain: Grain): void {
  if (blast.charge) implode(grain, blast.charge, blast.random);
  pull(grain);
  grain.x += grain.vx * STEP;
  grain.y += grain.vy * STEP;
  grain.angle += grain.spin * STEP;
  grain.heat *= Math.exp(-COOLING * STEP);
  if (grain.heat < 0.02) grain.heat = 0;
  if (isNearHome(grain)) settle(grain);
}

function isNearHome(grain: Grain): boolean {
  return (
    grain.loose <= 0 &&
    Math.abs(grain.x - grain.homeX) + Math.abs(grain.y - grain.homeY) < 0.012 &&
    Math.abs(grain.vx) + Math.abs(grain.vy) < 0.12
  );
}

function settle(grain: Grain): void {
  grain.x = grain.homeX;
  grain.y = grain.homeY;
  grain.vx = 0;
  grain.vy = 0;
  grain.angle = 0;
  grain.spin = 0;
  grain.loose = 0;
  if (grain.torn) grain.heat = 0.6;
  grain.torn = false;
}

function advanceSpark(spark: Spark): void {
  const drag = Math.exp(-1.6 * STEP);
  spark.vx *= drag;
  spark.vy = spark.vy * drag + GRAVITY * STEP;
  spark.x += spark.vx * STEP;
  spark.y += spark.vy * STEP;
  spark.life -= STEP;
}

function advanceStep(blast: Blast): void {
  if (blast.charge) blast.charge.level = Math.min(1, blast.charge.level + STEP / 1.4);
  for (const shock of blast.shocks) advanceShock(blast, shock);
  blast.shocks = blast.shocks.filter((shock) => !isSpent(shock, blast.scene));
  for (const grain of blast.grains) advanceGrain(blast, grain);
  for (const spark of blast.sparks) advanceSpark(spark);
  blast.sparks = blast.sparks.filter((spark) => spark.life > 0);
  blast.shake *= Math.exp(-10 * STEP);
}

export function advance(blast: Blast, seconds: number): void {
  blast.lag += Math.min(seconds, CATCH_UP);
  while (blast.lag >= STEP) {
    advanceStep(blast);
    blast.lag -= STEP;
  }
}

function isHome(grain: Grain): boolean {
  return !grain.torn && grain.loose <= 0 && grain.x === grain.homeX && grain.y === grain.homeY;
}

/** Every grain is home and no ring is still on its way. */
export function isWhole(blast: Blast): boolean {
  return !blast.charge && blast.shocks.length === 0 && blast.grains.every(isHome);
}

/** Nothing is changing anymore, so the loop may stop. */
export function isStill(blast: Blast): boolean {
  return (
    isWhole(blast) && blast.sparks.length === 0 && blast.grains.every((grain) => grain.heat === 0)
  );
}

/** The faulting address, reading the scene as a memory segment. */
export function addressOf(scene: Scene, x: number, y: number): string {
  const clamp = (value: number, limit: number): number =>
    Math.min(limit - 1, Math.max(0, Math.floor(value)));
  const offset = clamp(y, scene.rows) * scene.columns + clamp(x, scene.columns);
  return `0x${offset.toString(16).padStart(4, "0")}`;
}
