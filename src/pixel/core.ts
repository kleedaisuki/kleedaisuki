import { type Cell, parseSprite, type Tone } from "./cell.ts";

/**
 * Core is the site's mascot: a processor core that wears a four-leaf clover and dumps when touched.
 * The drawing is original; the clover is the moeSegFault Style emblem.
 */
const legend: Readonly<Record<string, Tone>> = {
  L: "leaf",
  V: "vein",
  r: "rim",
  s: "shell",
  p: "plate",
  b: "blush",
};

const body = parseSprite(
  [
    "......LL.....LL......",
    ".....LLLL...LLLL.....",
    ".....LLLLL.LLLLL.....",
    ".......LLLVLLL.......",
    ".......LLLVLLL.......",
    ".....LLLLLVLLLLL.....",
    ".....LLLL.V.LLLL.....",
    "......LL..V..LL......",
    "..........V..........",
    "...rrrrrrrrrrrrrrr...",
    "..rsssssssssssssssr..",
    "..rsssssssssssssssr..",
    "rrrsspppppppppppssrrr",
    "..rspppppppppppppsr..",
    "..rspppppppppppppsr..",
    "rrrspppppppppppppsrrr",
    "..rspppppppppppppsr..",
    "..rspppppppppppppsr..",
    "rrrsbbpppppppppbbsrrr",
    "..rspppppppppppppsr..",
    "..rsspppppppppppssr..",
    "rrrsssssssssssssssrrr",
    "..rsssssssssssssssr..",
    "...rrrrrrrrrrrrrrr...",
    ".....rr.......rr.....",
    ".....rr.......rr.....",
  ],
  legend,
);

export const CORE_WIDTH = 21;
export const CORE_HEIGHT = 26;
/** The row where the clover ends and the chip begins. */
export const CORE_CROWN = 9;
/** Where a blast starts when nobody pointed at a pixel. */
export const CORE_HEART = { x: CORE_WIDTH / 2, y: 16 } as const;

type Point = readonly [column: number, row: number];

/** Faces are drawn around the axis: only the left half is written down. */
function mirrored(left: readonly Point[], center: readonly Point[] = []): readonly Point[] {
  return [
    ...left,
    ...left.map(([column, row]): Point => [CORE_WIDTH - 1 - column, row]),
    ...center,
  ];
}

const openEye: readonly Point[] = [
  [6, 15],
  [6, 16],
  [6, 17],
  [7, 14],
  [7, 15],
  [7, 16],
  [7, 17],
];
const smile: readonly Point[] = [
  [8, 18],
  [9, 19],
  [10, 18],
  [11, 19],
  [12, 18],
];
const flat: readonly Point[] = [
  [9, 19],
  [10, 19],
  [11, 19],
];
const laugh: readonly Point[] = [
  [8, 18],
  [9, 18],
  [10, 18],
  [11, 18],
  [12, 18],
  [9, 19],
  [10, 19],
  [11, 19],
];

const faces = {
  calm: mirrored(openEye, smile),
  wince: mirrored(
    [
      [5, 13],
      [6, 14],
      [7, 15],
      [6, 16],
      [5, 17],
    ],
    [
      [9, 19],
      [10, 18],
      [11, 19],
    ],
  ),
  dizzy: mirrored(
    [
      [5, 14],
      [7, 14],
      [6, 15],
      [5, 16],
      [7, 16],
    ],
    flat,
  ),
  glad: mirrored(
    [
      [4, 16],
      [5, 15],
      [6, 14],
      [7, 15],
      [8, 16],
    ],
    laugh,
  ),
  starry: mirrored(
    [
      [6, 13],
      [6, 14],
      [4, 15],
      [5, 15],
      [6, 15],
      [7, 15],
      [8, 15],
      [6, 16],
      [6, 17],
    ],
    laugh,
  ),
  keen: mirrored(
    [
      [5, 13],
      [6, 14],
      [7, 14],
      [6, 16],
      [6, 17],
      [7, 16],
      [7, 17],
    ],
    smile,
  ),
  wink: [...openEye, [12, 16], [13, 15], [14, 15], [15, 16], ...smile] satisfies readonly Point[],
} as const;

export type Mood = keyof typeof faces;

/** Long enough for every mood, so a face can morph without gaining or losing pixels. */
export const FACE_CELLS = Math.max(...Object.values(faces).map((face) => face.length));

/** Shorter faces repeat their own pixels; the extras hide underneath. */
export function faceCells(mood: Mood): readonly Cell[] {
  const face: readonly Point[] = faces[mood];
  return Array.from({ length: FACE_CELLS }, (_, index) => {
    const [column, row] = face[index % face.length] as Point;
    return { column, row, tone: "ink" };
  });
}

export const coreBody: readonly Cell[] = body;

/** A face without padding, for drawings that never change expression. */
export function faceOnly(mood: Mood): readonly Cell[] {
  const face: readonly Point[] = faces[mood];
  return face.map(([column, row]) => ({ column, row, tone: "ink" }));
}
