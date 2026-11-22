import { addressOf } from "../pixel/blast.ts";
import { scenes } from "../pixel/scene.ts";
import { type Point, Stage } from "../pixel/stage.ts";

const TAP_POWER = 1;
const CHARGED_POWER = 1.6;
/** A full charge fires by itself, so holding on still ends. */
const FULL_CHARGE_MS = 1600;

const phone = matchMedia("(max-width: 52rem)");
const stillness = matchMedia("(prefers-reduced-motion: reduce)");

/** Brush, hold to charge, release to dump; springs put the pixels back. */
function mount(hero: HTMLElement): void {
  const canvas = hero.querySelector("canvas");
  const field = hero.querySelector<HTMLElement>("[data-core-field]");
  const trigger = hero.querySelector<HTMLButtonElement>("[data-core-trigger]");
  const output = hero.querySelector("output");
  if (!(canvas && field && trigger && output)) return;

  const recovered = hero.dataset.recoveredLabel ?? "";
  let fault = { address: "", started: 0 };
  let timer = 0;
  let last: (Point & { time: number }) | undefined;
  let aim: Point = { x: 0, y: 0 };

  const report = (): void => {
    const elapsed = Math.round(performance.now() - fault.started);
    output.textContent = `${fault.address} ${recovered} · ${elapsed} ms`;
  };
  const stage = new Stage(canvas, field, () => (phone.matches ? scenes.tall : scenes.wide), report);

  const fire = (point: Point, power: number): void => {
    fault = { address: addressOf(stage.scene, point.x, point.y), started: performance.now() };
    if (stillness.matches) {
      report();
      return;
    }
    output.textContent = `SIGSEGV @ ${fault.address}`;
    stage.detonate(point, power);
    navigator.vibrate?.(Math.round(12 * power));
  };
  const release = (): void => {
    const level = stage.chargeLevel;
    clearTimeout(timer);
    if (level === undefined) return;
    fire(aim, TAP_POWER + (CHARGED_POWER - TAP_POWER) * level);
  };

  field.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    aim = stage.locate(event);
    if (stillness.matches) {
      fire(aim, TAP_POWER);
      return;
    }
    field.setPointerCapture(event.pointerId);
    stage.charge(aim);
    timer = window.setTimeout(release, FULL_CHARGE_MS);
  });
  addEventListener("pointerup", release);
  addEventListener("pointercancel", () => {
    clearTimeout(timer);
    if (stage.chargeLevel !== undefined) stage.relax();
  });
  hero.addEventListener(
    "pointermove",
    (event) => {
      const point = stage.locate(event);
      const before = last;
      last = { ...point, time: event.timeStamp };
      if (stillness.matches) return;
      stage.watch(point);
      if (stage.chargeLevel !== undefined) {
        aim = point;
        stage.aim(point);
      }
      const seconds = before ? (event.timeStamp - before.time) / 1000 : 0;
      if (!before || seconds <= 0 || seconds > 0.2) return;
      stage.pet(point, Math.hypot(point.x - before.x, point.y - before.y));
      stage.stir(point, { x: (point.x - before.x) / seconds, y: (point.y - before.y) / seconds });
    },
    { passive: true },
  );
  trigger.addEventListener("click", () => fire(stage.heart, TAP_POWER));
  for (const type of ["pointerenter", "focus"]) {
    trigger.addEventListener(type, () => stage.worry());
  }
  for (const type of ["pointerleave", "blur"]) {
    trigger.addEventListener(type, () => stage.reassure());
  }

  trigger.hidden = false;
  hero.dataset.coreReady = "";
  /* The page transition captures the static drawing, so the canvas steps aside first. */
  addEventListener("pageswap", () => delete hero.dataset.coreReady);
  addEventListener("pageshow", () => {
    hero.dataset.coreReady = "";
  });
}

for (const hero of document.querySelectorAll<HTMLElement>("[data-core-dump]")) mount(hero);
