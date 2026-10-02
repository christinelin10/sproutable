const art: Record<string, string[]> = {
  tomato: [
    ".....gg......",
    "....gggg.....",
    "...rrrrrr....",
    "..rrRrrrrr...",
    "..rrrrrrrr...",
    "...rrrrrr....",
    "....rrrr.....",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
  pepper: [
    ".....gg......",
    ".....gg......",
    "....gggg.....",
    "...ggGGgg....",
    "...gggggg....",
    "...gggggg....",
    "....gggg.....",
    "......s......",
    "...bbbbbbb...",
  ],
  bean: [
    "..gg....gg...",
    ".gggg..gggg..",
    "..gg....gg...",
    "...gg..gg....",
    "....gggg.....",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
  strawberry: [
    "....gggg.....",
    "...gggggg....",
    "...rRrRrr....",
    "..rrRrrRrr...",
    "..rrrrRrrr...",
    "...rrrrrr....",
    "....rrrr.....",
    "...bbbbbbb...",
  ],
  sunflower: [
    "..yyyyyyyy...",
    ".yyoooooyy...",
    ".yoooooooy...",
    ".yyoooooyy...",
    "..yyyyyyyy...",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
  leaf: [
    "...gggg......",
    "..ggGGgg.....",
    ".gggggggg....",
    "..gggggg.....",
    "....ggg......",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
  corn: [
    "....yyyy.....",
    "...yyyyyy....",
    "..gyyyyyyg...",
    "..gyyyyyyg...",
    "...yyyyyy....",
    "......s......",
    "...bbbbbbb...",
  ],
  squash: [
    "...oooooo....",
    "..ooOOOoooo..",
    "..oooooooos..",
    "...oooooo....",
    "......s......",
    "...bbbbbbb...",
  ],
  garlic: [
    "....wwww.....",
    "...wwWWww....",
    "...wwwwww....",
    "....wwww.....",
    "......s......",
    "...bbbbbbb...",
  ],
  milkweed: [
    "..pp....pp...",
    ".pppp..pppp..",
    "..pp....pp...",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
  sprout: [
    "....gg..gg...",
    "...ggggggg...",
    "....gggg.....",
    "......s......",
    "......s......",
    "...bbbbbbb...",
  ],
};

const paint: Record<string, string> = {
  g: "#3f8f55",
  G: "#8fce73",
  r: "#d84b3a",
  R: "#f07a64",
  y: "#e3b23c",
  o: "#e07a2f",
  O: "#c9842a",
  w: "#f4e7c5",
  W: "#fffdf8",
  p: "#e7a0c4",
  s: "#2f6b45",
  b: "#6b3f22",
};

function kindFor(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return "tomato";
  if (name.includes("pepper")) return "pepper";
  if (name.includes("bean")) return "bean";
  if (name.includes("strawberr")) return "strawberry";
  if (name.includes("sunflower")) return "sunflower";
  if (name.includes("kale") || name.includes("lettuce") || name.includes("basil") || name.includes("herb")) return "leaf";
  if (name.includes("corn")) return "corn";
  if (name.includes("squash") || name.includes("pumpkin")) return "squash";
  if (name.includes("garlic")) return "garlic";
  if (name.includes("milkweed")) return "milkweed";
  return "sprout";
}

export function CropMark({ crop, className = "h-16 w-16" }: { crop: string; className?: string }) {
  const rows = art[kindFor(crop)];
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true" focusable="false" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid meet">
      {rows.flatMap((row, y) =>
        [...row].flatMap((cell, x) => {
          const fill = paint[cell];
          if (!fill) return [];
          return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />;
        }),
      )}
    </svg>
  );
}
