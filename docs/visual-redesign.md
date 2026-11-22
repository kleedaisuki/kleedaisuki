# Visual redesign on moeSegFault Style v0.2.0

Date: 2026-11-22. Covers `me.moesegfault.dev` and the GitHub profile README.

## Idea

The page is a process named `me`, and it may crash. Crimson, honey, clover, and leather come from moeSegFault Style
v0.2.0; what belongs to this site is **Core**, a pixel processor core that wears a four-leaf clover, stands on a pixel
wordmark, and dumps when pressed. The drawing is original.

| Surface | Read as | Why |
| --- | --- | --- |
| Home hero | A core dump | Brush, hold to charge, release; springs rebuild the drawing and report the fault address. |
| Home links | A memory map | Permission bits carry meaning: projects execute, now is writable, uses is read-only, sibling sites are shared. |
| Identity fragments | A backtrace | Six quotes become six numbered frames, parsed from the profile Markdown. |
| Projects | A heap | One block per repository, newest first, linked to its card; hue groups language families, and the legend filters. |
| Inner pages | A spec sheet | One rail for headings, one column for content, hairlines between. |
| 404 | An unmapped address | `0x194` is 404. |

## Labels

Layout explains; text is for content. No eyebrows, ledes under page titles, section numbers, command-line captions, or
keys beside values that identify themselves (an address, a place, a date). Text stays when removing it would leave a
reader guessing: product names get one sentence, counts get a noun. Assistive technology still hears the missing words,
through `aria-label` or `.moe-visually-hidden`; marks that are pure decoration are `aria-hidden`.

The preferred contact channel keeps the edge that the others show only when touched. A live profile is a dot.

## Microinteractions

Only what is touched moves, on package springs that are zero under reduced motion.

| Touched | Answer |
| --- | --- |
| Core, hero | Stroke it and it is glad; consider the button and it winces; hold and drag and the charge follows; a blast taps the phone. |
| Core, elsewhere | Hops and changes face on hover, squashes on press. CSS only, from layered faces in one SVG. |
| Memory map | Set bits rise in order; the arrow leans the way it leads. |
| Frame | The current-frame edge grows, the number steps in, the icon tilts. |
| Heap | The block and its neighbors rise and its name appears in a fixed spot; the link stays still, so nothing slips from under the pointer. |
| Legend | Cards glide to their places through a view transition. A dimmed block clears the filter before jumping. |
| Landing on a card | An outline closes in once; the border stays marked. |
| Theme | One body sets as the other rises. |
| Live profile | The dot rings once; only numbers that changed slide in. |

## Structure

- [`src/pixel`](../src/pixel) is the only source of pixel art. `cell.ts` defines tones, `core.ts` the mascot and its
  expressions, `typeface.ts` a 5×7 face, `scene.ts` the compositions, `blast.ts` the simulation.
- [`blast.ts`](../src/pixel/blast.ts) is pure. Every grain is a spring around a home that may move, so a blast, a glance,
  and a change of expression are one mechanism. Faces are padded to one length, so expressions morph.
- [`stage.ts`](../src/pixel/stage.ts) runs frames only while something moves and is visible. The static SVG is drawn from
  the same cells; without scripts it is the hero, and with reduced motion the canvas only repeats it.
- [`scripts/art.ts`](../scripts/art.ts) renders the README and share-card art from the same cells and from package
  tokens. Run `pnpm art` after changing pixels; a unit test rejects stale files.

## Decisions

- **Package.** `@moesegfault/style` is not on npm, and its repository has no prebuilt package, so the packed release is
  vendored in `vendor/` and pinned by lockfile integrity. Rebuild it with `pnpm build:library` and `pnpm pack` in the
  style repository. Replace it with a registry version when one exists.
- **Dropped dependencies.** `pnpm-workspace.yaml` removes Tiptap from the graph. The editor entrypoint is unusable here by
  design; every other entrypoint works.
- **`[hidden]`.** Library controls set `display` in a layer, which beats the user-agent rule. `site.css` restores it.
- **Theme.** The attribute is now `data-moe-theme` and may be `auto`. The storage key stays `site-theme`, so saved
  preferences survive.
- **Brand name.** v0.2.0 writes it moeSegFault; the site and its metadata follow.
- **Scroll reveals** are gone. They hid content until a script ran, and the style rules animate only what is touched or new.
- **README.** It is the GitHub profile, not project documentation. Its text is real text, its SVG needs no fonts, links, or
  scripts, and the banner dissolves into transparency so it fits either GitHub theme. The banner animates once and is
  static under reduced motion. Keep the first column narrow: phones give the table about 300 px.
  The tools' second column asks for 720 px and is clamped, so both
  tables span the page; percentages do nothing because GitHub lays tables out as `display: block`.

## Verification on 2026-11-22

- Unit tests, type check, lint, format, discovery check.
- 145 browser tests across Chromium, Firefox, Pixel 7 and two WeChat-like Chromium profiles, through the local Worker.
- README rendered through GitHub's Markdown API with `github-markdown-css` at 888 and 375 px, light and dark.
- Blast cost, headless Chromium at 1920×1000: median 1.3 ms per frame, p95 8.6 ms at 1× and 8.3 ms at 2×, worst single
  frame 21.1 ms. Zero frames at rest.
- Production: every route, the profile card, a blast, and the project filter; the README on github.com at 360–1280 px.
- Not covered: WebKit (system libraries missing on this machine), physical devices, assistive technology.
