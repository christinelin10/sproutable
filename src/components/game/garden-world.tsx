import Link from "next/link";
import type { ReactNode } from "react";
import { GardenerSprite } from "@/components/game/gardener-sprite";
import { PlantSprite } from "@/components/game/plant-sprite";

type DoorKind = "map" | "events" | "growing" | "progress" | "gardener";

const place: Record<DoorKind, string> = {
  events: "lg:col-start-2 lg:row-start-1",
  map: "lg:col-start-1 lg:row-start-2",
  gardener: "lg:col-start-2 lg:row-start-2",
  growing: "lg:col-start-3 lg:row-start-2",
  progress: "lg:col-start-2 lg:row-start-3",
};

function DoorArt({ kind }: { kind: DoorKind }) {
  if (kind === "gardener") return <GardenerSprite className="h-16 w-16" />;
  if (kind === "map") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
        <rect x="30" y="18" width="4" height="36" fill="#6b3f22" />
        <rect x="10" y="14" width="28" height="16" fill="#f4e7c5" stroke="#3d2914" strokeWidth="2" />
        <path d="M16 22h16M16 26h10" stroke="#215c45" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "events") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
        <rect x="8" y="10" width="48" height="40" fill="#c9842a" />
        <rect x="12" y="14" width="40" height="32" fill="#e7c9a0" />
        <rect x="16" y="18" width="14" height="10" fill="#fffdf8" />
        <rect x="34" y="20" width="14" height="12" fill="#f6d36b" />
        <rect x="18" y="32" width="16" height="10" fill="#d7eccf" />
      </svg>
    );
  }
  if (kind === "progress") {
    return (
      <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
        <rect x="16" y="28" width="32" height="22" fill="#8f3b1c" />
        <rect x="20" y="18" width="24" height="12" fill="#e3b23c" />
        <rect x="28" y="12" width="8" height="8" fill="#fffdf8" />
      </svg>
    );
  }
  return <PlantSprite stage="growing" className="plant-sway h-16 w-16" />;
}

export function GardenWorld({
  eyebrow,
  title,
  body,
  sceneLabel,
  bloom,
  meter,
  doors,
}: {
  eyebrow: string;
  title: string;
  body: string;
  sceneLabel: string;
  bloom: number;
  meter: ReactNode;
  doors: Array<{ kind: DoorKind; href: string; kicker: string; title: string; detail: string }>;
}) {
  const flowers = Math.max(2, bloom + 2);
  return (
    <section className="garden-sky overflow-hidden rounded-[1.25rem] border-4 border-[#3d2914] shadow-[6px_6px_0_#3d2914]" aria-label={sceneLabel}>
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-2 pt-5 sm:px-6">
        <div className="max-w-xl">
          <p className="font-semibold text-primary">{eyebrow}</p>
          <h1 className="mt-1 font-game text-4xl leading-none text-[#3d2914] sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-xl text-lg">{body}</p>
        </div>
        <div className="w-full rounded-2xl border-[3px] border-[#3d2914] bg-[#fffdf8]/90 p-3 sm:w-auto">{meter}</div>
      </div>
      <div className="relative px-4 pb-4 sm:px-6">
        <div className="pointer-events-none absolute right-10 top-0 hidden h-14 w-14 rounded-full border-4 border-[#3d2914] bg-[#e3b23c] sun-bob lg:block" aria-hidden="true" />
        <ul className="relative grid gap-3 lg:min-h-[28rem] lg:grid-cols-3 lg:grid-rows-3">
          {doors.map((door) => (
            <li key={door.kind} className={place[door.kind]}>
              <Link href={door.href} className="game-panel flex h-full min-h-28 items-center gap-3 bg-[#fffdf8]/95 p-4 hover:-translate-y-0.5">
                <DoorArt kind={door.kind} />
                <span>
                  <span className="font-game text-sm text-primary">{door.kicker}</span>
                  <span className="mt-1 block font-game text-2xl leading-tight text-[#3d2914]">{door.title}</span>
                  <span className="mt-1 block text-sm text-muted">{door.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-end gap-2 bg-[#7dae55] px-4 py-2" aria-hidden="true">
        {Array.from({ length: flowers }, (_, index) => (
          <PlantSprite key={index} stage={index < bloom ? "harvest" : "growing"} className="plant-sway h-10 w-10" />
        ))}
      </div>
    </section>
  );
}
