const stillness = matchMedia("(prefers-reduced-motion: reduce)");

/** Cards glide to their new places when the browser can, and are simply there when it cannot. */
function rearrange(apply: () => void): void {
  if (stillness.matches || !document.startViewTransition) {
    apply();
    return;
  }
  const root = document.documentElement;
  root.dataset.heapShift = "";
  document.startViewTransition(apply).finished.finally(() => delete root.dataset.heapShift);
}

/** The legend doubles as a filter: one language at a time, pressed again to let go. */
function mount(directory: HTMLElement): void {
  const keys = directory.querySelectorAll<HTMLButtonElement>("button[data-language]");
  const blocks = directory.querySelectorAll<HTMLElement>(".heap__map a");
  const cards = directory.querySelectorAll<HTMLElement>("li[data-project]");

  const show = (language: string | undefined): void => {
    const away = (item: HTMLElement): boolean =>
      language !== undefined && item.dataset.language !== language;
    for (const key of keys) {
      key.setAttribute("aria-pressed", String(key.dataset.language === language));
    }
    for (const block of blocks) block.toggleAttribute("data-away", away(block));
    for (const card of cards) card.hidden = away(card);
  };

  directory.addEventListener("click", (event) => {
    const target = event.target as Element;
    const key = target.closest<HTMLButtonElement>("button[data-language]");
    if (key) {
      const pressed = key.getAttribute("aria-pressed") === "true";
      rearrange(() => show(pressed ? undefined : key.dataset.language));
      return;
    }
    /* A dimmed block still leads to its card, so the card has to exist before the jump. */
    if (target.closest("[data-away]")) show(undefined);
  });
}

for (const directory of document.querySelectorAll<HTMLElement>("[data-projects]")) mount(directory);
