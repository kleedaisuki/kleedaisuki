import { type Cell, parseSprite, type Tone } from "./cell.ts";

const legend: Readonly<Record<string, Tone>> = {
  r: "rim",
  s: "shell",
  p: "plate",
  k: "ink",
  b: "blush",
};

export const ICON_SIZE = 11;

/** Pixel stand-ins for the emoji that mark each identity fragment. */
const icons: Readonly<Record<string, readonly Cell[]>> = {
  "💻": parseSprite(
    [
      ".rrrrrrrrr.",
      "rsssssssssr",
      "rrrrrrrrrrr",
      "rpppppppppr",
      "rpkpppppppr",
      "rppkppppppr",
      "rpkpkkkpppr",
      "rpppppppppr",
      "rpppppppppr",
      ".rrrrrrrrr.",
    ],
    legend,
  ),
  "📐": parseSprite(
    [
      ".rrrrrrrrr.",
      "rpppppppppr",
      "rpkkkkkkkpr",
      "rppkkpppkpr",
      "rpppkkppppr",
      "rppppkkpppr",
      "rpppkkppppr",
      "rppkkpppkpr",
      "rpkkkkkkkpr",
      "rpppppppppr",
      ".rrrrrrrrr.",
    ],
    legend,
  ),
  "📖": parseSprite(
    [
      "...........",
      ".rrrr.rrrr.",
      "rpppprppppr",
      "rpkkprpkkpr",
      "rpppprppppr",
      "rpkkprpkkpr",
      "rpppprppppr",
      "rpkkprpkkpr",
      "rpppprppppr",
      ".rrrrrrrrr.",
      ".....r.....",
    ],
    legend,
  ),
  "🤖": parseSprite(
    [
      ".....r.....",
      ".....s.....",
      "....rsr....",
      "....sss....",
      "..rsspssr..",
      "rssspppsssr",
      "..rsspssr..",
      "....sss....",
      "....rsr....",
      ".....s.....",
      ".....r.....",
    ],
    legend,
  ),
  "🏫": parseSprite(
    [
      ".....rbb...",
      ".....r.....",
      "....rsr....",
      "...rsssr...",
      "..rsssssr..",
      ".rrrrrrrrr.",
      ".rpkpppkpr.",
      ".rpppppppr.",
      ".rpkpkpkpr.",
      ".rpppkpppr.",
      ".rrrrrrrrr.",
    ],
    legend,
  ),
  "⚠️": parseSprite(
    [
      "...........",
      "..bbb.bbb..",
      ".bbbbbbbbb.",
      ".bpbbbbbbb.",
      ".bpbbbbbbb.",
      ".bbbbbbbbb.",
      "..bbbbbbb..",
      "...bbbbb...",
      "....bbb....",
      ".....b.....",
    ],
    legend,
  ),
};

export function pixelIcon(mark: string): readonly Cell[] | undefined {
  return icons[mark];
}

export const iconMarks: readonly string[] = Object.keys(icons);
