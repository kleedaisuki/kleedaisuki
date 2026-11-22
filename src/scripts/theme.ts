import { applyTheme, type MoeTheme } from "@moesegfault/style";

const POINTS = 96;
const PETAL = 0.26;
const DURATION = 680;

/** A four-lobed outline whose narrowest reach still covers the farthest corner. */
function cloverPolygon(x: number, y: number, radius: number, turn: number): string {
  const points = Array.from({ length: POINTS }, (_, index) => {
    const angle = (index / POINTS) * 2 * Math.PI;
    const reach = radius * (1 + PETAL * Math.cos(4 * angle));
    const px = x + reach * Math.cos(angle + turn);
    const py = y + reach * Math.sin(angle + turn);
    return `${px.toFixed(1)}px ${py.toFixed(1)}px`;
  });
  return `polygon(${points.join(",")})`;
}

function unfold(origin: Element): void {
  const box = origin.getBoundingClientRect();
  const x = box.left + box.width / 2;
  const y = box.top + box.height / 2;
  const corner = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.documentElement.animate(
    {
      clipPath: [
        cloverPolygon(x, y, 0, -Math.PI / 2),
        cloverPolygon(x, y, corner / (1 - PETAL), Math.PI / 4),
      ],
    },
    {
      duration: DURATION,
      easing: "cubic-bezier(0.5, 0, 0.1, 1)",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

/** The new theme unfolds from the button as a clover, or simply applies. */
function reveal(origin: Element, apply: () => void): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !document.startViewTransition) {
    apply();
    return;
  }
  const root = document.documentElement;
  root.dataset.themeShift = "";
  const transition = document.startViewTransition(apply);
  transition.ready.then(() => unfold(origin)).catch(() => undefined);
  transition.finished.finally(() => delete root.dataset.themeShift);
}

const systemDark = matchMedia("(prefers-color-scheme: dark)");

function currentTheme(): MoeTheme {
  const preference = document.documentElement.dataset.moeTheme;
  if (preference === "light" || preference === "dark") return preference;
  return systemDark.matches ? "dark" : "light";
}

function mount(toggle: HTMLButtonElement): void {
  const status = toggle.querySelector("[data-theme-status]");
  const storageKey = toggle.dataset.themeToggle ?? "";

  const sync = (): void => {
    const dark = currentTheme() === "dark";
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.title = (dark ? toggle.dataset.toLight : toggle.dataset.toDark) ?? "";
    const background = getComputedStyle(document.body).backgroundColor;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.content = background;
    }
  };

  toggle.addEventListener("click", () => {
    const next: MoeTheme = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // Restricted containers still get an in-page switch.
    }
    reveal(toggle, () => {
      applyTheme(next);
      sync();
    });
    if (status)
      status.textContent =
        (next === "dark" ? toggle.dataset.darkLabel : toggle.dataset.lightLabel) ?? "";
  });
  systemDark.addEventListener("change", sync);
  sync();
}

const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
if (toggle) mount(toggle);
