/** Every pixel drawing on the site, in the profile README, and on the share card uses these tones. */
export type Tone = "moe" | "name" | "rim" | "shell" | "plate" | "ink" | "blush" | "leaf" | "vein";

export interface Cell {
  readonly column: number;
  readonly row: number;
  readonly tone: Tone;
}

/** Filled share of a cell; the rest is the gap that keeps pixels countable. */
export const CELL_FILL = 0.86;

/** Back to front; later tones cover earlier ones. */
const PAINT_ORDER: readonly Tone[] = [
  "moe",
  "name",
  "vein",
  "leaf",
  "rim",
  "shell",
  "plate",
  "blush",
  "ink",
];

export function parseSprite(
  rows: readonly string[],
  legend: Readonly<Record<string, Tone>>,
): readonly Cell[] {
  return rows.flatMap((line, row) =>
    [...line].flatMap((mark, column) => {
      const tone = legend[mark];
      return tone ? [{ column, row, tone }] : [];
    }),
  );
}

export function place(cells: readonly Cell[], column: number, row: number): readonly Cell[] {
  return cells.map((cell) => ({ ...cell, column: cell.column + column, row: cell.row + row }));
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

export function cellsToPath(cells: readonly Cell[], fill = CELL_FILL): string {
  const inset = (1 - fill) / 2;
  return cells
    .map(
      ({ column, row }) =>
        `M${round(column + inset)} ${round(row + inset)}h${fill}v${fill}h-${fill}z`,
    )
    .join("");
}

/** One path per tone instead of hundreds of rects. */
export function tonePaths(
  cells: readonly Cell[],
  fill = CELL_FILL,
): readonly { tone: Tone; d: string }[] {
  return PAINT_ORDER.flatMap((tone) => {
    const layer = cells.filter((cell) => cell.tone === tone);
    return layer.length > 0 ? [{ tone, d: cellsToPath(layer, fill) }] : [];
  });
}
