/** The 8×8 Bayer order moeSegFault Style uses: pixels vary in density, never in opacity. */
const SIDE = 8;

function bayerRank(column: number, row: number): number {
  let rank = 0;
  for (let bit = 0; bit < 3; bit++) {
    const y = (row >> bit) & 1;
    const x = (column >> bit) & 1;
    rank = (rank << 2) | (((x ^ y) << 1) | y);
  }
  return rank;
}

const thresholds = Float32Array.from(
  { length: SIDE * SIDE },
  (_, index) => (bayerRank(index % SIDE, Math.floor(index / SIDE)) + 0.5) / (SIDE * SIDE),
);

/** Within (0, 1) and averaging one half, so dithering preserves tone. */
export function threshold(column: number, row: number): number {
  return thresholds[(row & (SIDE - 1)) * SIDE + (column & (SIDE - 1))] as number;
}

/** Cells of an edge that goes from sparse at the top to solid at the bottom. */
export function ditherPath(columns: number, rows: number): string {
  let path = "";
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if ((row + 0.5) / rows > threshold(column, row)) path += `M${column} ${row}h1v1h-1z`;
    }
  }
  return path;
}

/** A horizontally tiling CSS mask of the same edge. */
export function ditherMask(rows: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${SIDE} ${rows}' shape-rendering='crispEdges'><path d='${ditherPath(SIDE, rows)}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
