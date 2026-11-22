import {
  advance,
  type Blast,
  beginCharge,
  createBlast,
  detonate,
  express,
  isStill,
  isWhole,
  stir,
} from "./blast.ts";
import { CORE_HEART, CORE_HEIGHT, CORE_WIDTH, type Mood } from "./core.ts";
import { type Palette, paintBlast, paintGround, readPalette, type View } from "./painter.ts";
import type { Scene } from "./scene.ts";

const MAX_RATIO = 2;
/** How far away the pointer must be, in cells, before Core looks that way. */
const GAZE_REACH = 5;
/** How far the pointer must travel over Core, in cells, before it counts as petting. */
const PETTING = 72;
/** How long Core stays pleased. */
const GLAD_MS = 1600;

export interface Point {
  readonly x: number;
  readonly y: number;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  return context;
}

function glance(offset: number): number {
  return Math.abs(offset) < GAZE_REACH ? 0 : Math.sign(offset);
}

/** Wires the simulation to a canvas; frames run only while something moves and is visible. */
export class Stage {
  private readonly context: CanvasRenderingContext2D;
  private readonly ground: CanvasRenderingContext2D;
  private blast: Blast;
  private view: View = { width: 0, height: 0, unit: 1, left: 0, top: 0 };
  private palette: Palette;
  private mood: Mood = "calm";
  private gaze: Point = { x: 0, y: 0 };
  private petted = 0;
  private gladTimer = 0;
  private request = 0;
  private previous = 0;
  private visible = true;
  private whole = true;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly field: HTMLElement,
    private readonly pickScene: () => Scene,
    private readonly onWhole: () => void,
  ) {
    this.context = context2d(canvas);
    this.ground = context2d(document.createElement("canvas"));
    this.palette = readPalette(canvas);
    this.blast = createBlast(pickScene());
    const measure = new ResizeObserver(() => this.measure());
    measure.observe(canvas);
    measure.observe(field);
    new MutationObserver(() => this.measure()).observe(document.documentElement, {
      attributeFilter: ["data-moe-theme"],
    });
    new IntersectionObserver(([entry]) => {
      this.visible = entry?.isIntersecting ?? false;
      this.wake();
    }).observe(canvas);
    this.measure();
  }

  get scene(): Scene {
    return this.blast.scene;
  }

  get chargeLevel(): number | undefined {
    return this.blast.charge?.level;
  }

  get heart(): Point {
    const { column, row } = this.scene.core;
    return { x: column + CORE_HEART.x, y: row + CORE_HEART.y };
  }

  /** Viewport coordinates to cells. */
  locate(event: { clientX: number; clientY: number }): Point {
    const box = this.canvas.getBoundingClientRect();
    const scale = this.canvas.width / box.width / this.view.unit;
    return {
      x: (event.clientX - box.left) * scale - this.view.left / this.view.unit,
      y: (event.clientY - box.top) * scale - this.view.top / this.view.unit,
    };
  }

  charge({ x, y }: Point): void {
    beginCharge(this.blast, x, y);
    this.feel("wince");
  }

  /** The charge follows a finger that slides while holding. */
  aim({ x, y }: Point): void {
    if (this.blast.charge) Object.assign(this.blast.charge, { x, y });
  }

  /** Core notices that someone is considering the button. */
  worry(): void {
    if (this.mood === "calm" || this.mood === "glad") this.feel("wince");
  }

  /** Nothing happened after all. A charge in progress is still something. */
  reassure(): void {
    if (this.mood === "wince" && !this.blast.charge) this.feel("calm");
  }

  pet(point: Point, distance: number): void {
    this.petted = this.mood === "calm" && this.touches(point) ? this.petted + distance : 0;
    if (this.petted > PETTING) this.feel("glad");
  }

  private touches({ x, y }: Point): boolean {
    const { column, row } = this.scene.core;
    return x >= column && x < column + CORE_WIDTH && y >= row && y < row + CORE_HEIGHT;
  }

  /** Abandon the charge; the springs recover on their own. */
  relax(): void {
    this.blast.charge = undefined;
    this.feel("calm");
  }

  detonate({ x, y }: Point, power: number): void {
    detonate(this.blast, x, y, power);
    this.whole = false;
    this.feel("dizzy");
  }

  stir({ x, y }: Point, velocity: Point): void {
    stir(this.blast, x, y, velocity.x, velocity.y);
    this.wake();
  }

  watch({ x, y }: Point): void {
    const gaze = { x: glance(x - this.heart.x), y: glance(y - this.heart.y) };
    if (gaze.x === this.gaze.x && gaze.y === this.gaze.y) return;
    this.gaze = gaze;
    this.feel(this.mood);
  }

  private feel(mood: Mood): void {
    clearTimeout(this.gladTimer);
    this.mood = mood;
    /* Only a calm Core has the attention to look around. */
    const gaze = mood === "calm" ? this.gaze : { x: 0, y: 0 };
    express(this.blast, mood, gaze.x, gaze.y);
    if (mood === "glad") this.gladTimer = window.setTimeout(() => this.feel("calm"), GLAD_MS);
    this.wake();
  }

  private measure(): void {
    const scene = this.pickScene();
    if (scene !== this.scene) this.blast = createBlast(scene);
    const ratio = Math.min(devicePixelRatio, MAX_RATIO);
    const canvas = this.canvas.getBoundingClientRect();
    const field = this.field.getBoundingClientRect();
    this.view = {
      width: Math.round(canvas.width * ratio),
      height: Math.round(canvas.height * ratio),
      unit: (field.width / scene.columns) * ratio,
      left: (field.left - canvas.left) * ratio,
      top: (field.bottom - canvas.top) * ratio - (field.width / scene.columns) * scene.rows * ratio,
    };
    this.palette = readPalette(this.canvas);
    for (const { canvas: surface } of [this.context, this.ground]) {
      surface.width = this.view.width;
      surface.height = this.view.height;
    }
    if (this.view.width === 0) return;
    paintGround(this.ground, this.blast, this.view, this.palette);
    this.paint();
  }

  private paint(): void {
    if (this.view.width === 0) return;
    paintBlast(this.context, this.ground.canvas, this.blast, this.view, this.palette);
  }

  private wake(): void {
    if (this.request !== 0 || !this.visible) return;
    this.previous = performance.now();
    this.request = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number): void {
    this.request = 0;
    advance(this.blast, Math.max(0, now - this.previous) / 1000);
    this.paint();
    this.noticeRecovery();
    if (isStill(this.blast) || !this.visible) return;
    this.previous = now;
    this.request ||= requestAnimationFrame((next) => this.tick(next));
  }

  private noticeRecovery(): void {
    if (this.whole || !isWhole(this.blast)) return;
    this.whole = true;
    this.onWhole();
    this.feel("glad");
  }
}
