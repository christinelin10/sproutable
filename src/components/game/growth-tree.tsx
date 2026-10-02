const marks = [
  { id: "tree", glyph: "🌳" },
  { id: "youngTree", glyph: "🌲" },
  { id: "sapling", glyph: "🌿" },
  { id: "plant", glyph: "🌱" },
  { id: "young", glyph: "🌱" },
  { id: "sprout", glyph: "🌱" },
] as const;

export function GrowthTree({
  level,
  labels,
  you,
  start,
}: {
  level: number;
  labels: Record<(typeof marks)[number]["id"], string>;
  you: string;
  start: string;
}) {
  const current = level <= 1 ? "sprout" : level === 2 ? "young" : level === 3 ? "plant" : level === 4 ? "sapling" : level === 5 ? "youngTree" : "tree";
  return (
    <ol className="mx-auto flex max-w-sm flex-col items-stretch gap-0">
      {marks.map((mark, index) => {
        const active = mark.id === current;
        return (
          <li key={mark.id} className="grid grid-cols-[4.5rem_1.5rem_1fr] items-center">
            <span className={`text-right text-sm font-semibold ${active ? "text-primary" : "text-muted"}`}>{labels[mark.id]}</span>
            <span className="flex flex-col items-center">
              <span className={`text-2xl ${active ? "" : "opacity-50"}`} aria-hidden="true">{mark.glyph}</span>
              {index < marks.length - 1 ? <span className="h-6 w-1 bg-[#215c45]/40" /> : <span className="mt-1 text-xs font-semibold">{start}</span>}
            </span>
            <span className="text-sm font-semibold text-primary">{active ? you : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
