import { type Cell, place } from "./cell.ts";
import { CORE_WIDTH, coreBody } from "./core.ts";
import { CAP_HEIGHT, setType, type TypeSetting } from "./typeface.ts";

/** A wordmark that Core stands on. Core's face is kept apart because it moves on its own. */
export interface Scene {
  readonly columns: number;
  readonly rows: number;
  readonly cells: readonly Cell[];
  readonly core: { readonly column: number; readonly row: number };
}

const moe = setType("moe", "moe");
const name = setType("SegFault", "name");
const full: TypeSetting = {
  width: moe.width + 1 + name.width,
  cells: [...moe.cells, ...place(name.cells, moe.width + 1, 0)],
};

const DESCENT = 2;
const LEG_ROOM = 24;

/** Desktop: the whole name on one line, Core's legs resting on the x-height of "a" and "u". */
function wideScene(): Scene {
  const core = { column: 38, row: 0 };
  return {
    columns: full.width,
    rows: LEG_ROOM + CAP_HEIGHT + DESCENT,
    cells: [...place(full.cells, 0, LEG_ROOM), ...place(coreBody, core.column, core.row)],
    core,
  };
}

/** Phone: two lines, with Core beside the short first one. */
function tallScene(): Scene {
  const line = LEG_ROOM + 2;
  const core = { column: name.width - CORE_WIDTH - 1, row: 0 };
  return {
    columns: name.width,
    rows: line + CAP_HEIGHT + DESCENT,
    cells: [
      ...place(moe.cells, 0, line - CAP_HEIGHT - 2),
      ...place(name.cells, 0, line),
      ...place(coreBody, core.column, core.row),
    ],
    core,
  };
}

/** Profile banner: the name and Core share one ground line. */
function bannerScene(): Scene {
  const core = { column: full.width + 6, row: 0 };
  const line = 17;
  return {
    columns: core.column + CORE_WIDTH,
    rows: 26,
    cells: [...place(full.cells, 0, line), ...place(coreBody, core.column, core.row)],
    core,
  };
}

export const scenes = { wide: wideScene(), tall: tallScene(), banner: bannerScene() } as const;
export type SceneName = keyof typeof scenes;
