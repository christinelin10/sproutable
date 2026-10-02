"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GardenerSprite } from "@/components/game/gardener-sprite";

export type VillagePlace = {
  id: "community" | "growing" | "map" | "achievements";
  href: string;
  label: string;
  hint: string;
  x: number;
  y: number;
};

const shirts = ["#215c45", "#8f3b1c", "#3d6f8f", "#6b3f22", "#7a4e8a"];

function shirtFor(name: string) {
  const total = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return shirts[total % shirts.length];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Village({
  name,
  guest,
  places,
  caption,
  moveHint,
  enterLabel,
  tourHref,
  tourLabel,
}: {
  name: string;
  guest: boolean;
  places: VillagePlace[];
  caption: string;
  moveHint: string;
  enterLabel: string;
  tourHref: string;
  tourLabel: string;
}) {
  const router = useRouter();
  const scene = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 48, y: 52 });
  const goal = useRef<{ x: number; y: number } | null>(null);
  const held = useRef({ x: 0, y: 0 });
  const nearRef = useRef<string | null>(null);
  const [at, setAt] = useState({ x: 48, y: 52 });
  const [near, setNear] = useState<string | null>(null);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) event.preventDefault();
      if (key === "arrowup" || key === "w") held.current.y = -1;
      if (key === "arrowdown" || key === "s") held.current.y = 1;
      if (key === "arrowleft" || key === "a") held.current.x = -1;
      if (key === "arrowright" || key === "d") held.current.x = 1;
      if (key === "enter" && nearRef.current) {
        const place = places.find((item) => item.id === nearRef.current);
        if (place) router.push(place.href);
      }
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "arrowup" || key === "w" || key === "arrowdown" || key === "s") held.current.y = 0;
      if (key === "arrowleft" || key === "a" || key === "arrowright" || key === "d") held.current.x = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let { x, y } = pos.current;
      if (held.current.x || held.current.y) {
        goal.current = null;
        x += held.current.x * 28 * dt;
        y += held.current.y * 28 * dt;
      } else if (goal.current) {
        const dx = goal.current.x - x;
        const dy = goal.current.y - y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.6) goal.current = null;
        else {
          const step = Math.min(dist, 32 * dt);
          x += (dx / dist) * step;
          y += (dy / dist) * step;
        }
      }
      x = clamp(x, 8, 88);
      y = clamp(y, 16, 78);
      if (Math.abs(pos.current.x - x) > 0.05 || Math.abs(pos.current.y - y) > 0.05) {
        pos.current = { x, y };
        setAt({ x, y });
      }
      const closest = places
        .map((place) => ({ id: place.id, dist: Math.hypot(place.x - x, place.y - y) }))
        .sort((a, b) => a.dist - b.dist)[0];
      const nextNear = closest && closest.dist < 14 ? closest.id : null;
      if (nearRef.current !== nextNear) {
        nearRef.current = nextNear;
        setNear(nextNear);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [places, router]);

  function walkTo(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a,button")) return;
    const rect = scene.current?.getBoundingClientRect();
    if (!rect) return;
    goal.current = {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 88),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 16, 78),
    };
  }

  function hold(x: number, y: number) {
    held.current = { x, y };
    goal.current = null;
  }

  return (
    <section className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-6">
      <p className="font-game text-3xl text-[#3d2914] sm:text-4xl">{caption}</p>
      <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">{moveHint}</p>
      <div
        ref={scene}
        onPointerDown={walkTo}
        className="relative mt-3 h-[calc(100dvh-11rem)] min-h-[28rem] overflow-hidden rounded-[1.25rem] border-4 border-[#3d2914] shadow-[6px_6px_0_#3d2914]"
        style={{
          background:
            "linear-gradient(#8ec8ef 0 28%, #b7e0a8 28% 100%)",
        }}
      >
        <div className="absolute left-[18%] top-[34%] h-[46%] w-[64%] rounded-full bg-[#c4a574]/80" />
        <div className="absolute left-[8%] right-[8%] top-1/2 h-8 -translate-y-1/2 bg-[#d7c4a3]" />
        <div className="absolute bottom-[18%] left-1/2 top-[22%] w-8 -translate-x-1/2 bg-[#d7c4a3]" />
        <Tree className="absolute left-[6%] top-[8%] h-16 w-16" />
        <Tree className="absolute right-[8%] top-[10%] h-14 w-14" />
        <Flower className="absolute bottom-[10%] left-[14%]" />
        <Flower className="absolute bottom-[12%] right-[18%]" />
        <Flower className="absolute left-[30%] top-[22%]" />
        {places.map((place) => (
          <a
            key={place.id}
            href={place.href}
            className={`absolute z-10 flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border-[3px] bg-[#fffdf8]/95 p-2 text-center shadow-[3px_3px_0_#3d2914] sm:w-36 ${near === place.id ? "border-[#e3b23c]" : "border-[#3d2914]"}`}
            style={{ left: `${place.x}%`, top: `${place.y}%` }}
          >
            <PlaceArt id={place.id} />
            <span className="font-game text-lg leading-none text-[#3d2914] sm:text-xl">{place.label}</span>
            <span className="mt-1 hidden text-xs text-muted sm:block">{place.hint}</span>
            {near === place.id ? <span className="mt-1 text-xs font-semibold text-primary">{enterLabel}</span> : null}
          </a>
        ))}
        <Neighbor className="absolute left-[22%] top-[62%]" label="Ana" shirt="#3d6f8f" />
        <Neighbor className="absolute right-[20%] top-[24%]" label="Luis" shirt="#8f3b1c" />
        <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
          <GardenerSprite className="mx-auto h-16 w-16 drop-shadow" shirt={shirtFor(name)} />
          <span className="mt-0.5 inline-block rounded-full bg-[#fffdf8]/90 px-2 font-game text-sm text-[#3d2914]">{name}</span>
        </div>
        <div className="absolute bottom-3 left-3 z-30 grid grid-cols-3 gap-1 sm:hidden">
          <span />
          <Pad label="Up" onDown={() => hold(0, -1)} onUp={() => hold(0, 0)}>↑</Pad>
          <span />
          <Pad label="Left" onDown={() => hold(-1, 0)} onUp={() => hold(0, 0)}>←</Pad>
          <span />
          <Pad label="Right" onDown={() => hold(1, 0)} onUp={() => hold(0, 0)}>→</Pad>
          <span />
          <Pad label="Down" onDown={() => hold(0, 1)} onUp={() => hold(0, 0)}>↓</Pad>
          <span />
        </div>
      </div>
      {guest ? (
        <p className="mt-3 text-sm">
          <a href={tourHref} className="font-semibold text-primary underline">{tourLabel}</a>
        </p>
      ) : null}
    </section>
  );
}

function Pad({ children, label, onDown, onUp }: { children: string; label: string; onDown: () => void; onUp: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-11 w-11 rounded-xl border-[3px] border-[#3d2914] bg-[#fffdf8] font-game text-xl"
      onPointerDown={(event) => {
        event.stopPropagation();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {children}
    </button>
  );
}

function Neighbor({ className, label, shirt }: { className: string; label: string; shirt: string }) {
  return (
    <div className={`${className} text-center`}>
      <GardenerSprite className="h-12 w-12" shirt={shirt} />
      <span className="font-game text-sm text-[#3d2914]">{label}</span>
    </div>
  );
}

function Tree({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="7" y="10" width="2" height="5" fill="#6b3f22" />
      <rect x="4" y="6" width="8" height="5" fill="#2f6b45" />
      <rect x="5" y="3" width="6" height="4" fill="#3f8f55" />
    </svg>
  );
}

function Flower({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 8 8" className={`${className} h-6 w-6`} aria-hidden="true" shapeRendering="crispEdges">
      <rect x="3" y="3" width="2" height="5" fill="#2f6b45" />
      <rect x="2" y="1" width="4" height="3" fill="#e07a2f" />
    </svg>
  );
}

function PlaceArt({ id }: { id: VillagePlace["id"] }) {
  if (id === "community") {
    return (
      <svg viewBox="0 0 16 12" className="h-10 w-14" aria-hidden="true" shapeRendering="crispEdges">
        <rect x="1" y="2" width="14" height="9" fill="#8a5a32" />
        <rect x="2" y="3" width="5" height="4" fill="#f4e7c5" />
        <rect x="8" y="3" width="6" height="3" fill="#fffdf8" />
        <rect x="8" y="7" width="5" height="3" fill="#d7eccf" />
      </svg>
    );
  }
  if (id === "growing") {
    return (
      <svg viewBox="0 0 16 12" className="h-10 w-14" aria-hidden="true" shapeRendering="crispEdges">
        <rect x="1" y="4" width="14" height="7" fill="#6b3f22" />
        <rect x="2" y="5" width="5" height="5" fill="#3f8f55" />
        <rect x="9" y="5" width="5" height="5" fill="#7dbe6a" />
        <rect x="4" y="1" width="3" height="4" fill="#d84b3a" />
        <rect x="10" y="2" width="3" height="3" fill="#e3b23c" />
      </svg>
    );
  }
  if (id === "map") {
    return (
      <svg viewBox="0 0 16 12" className="h-10 w-14" aria-hidden="true" shapeRendering="crispEdges">
        <rect x="7" y="3" width="2" height="8" fill="#6b3f22" />
        <rect x="2" y="2" width="8" height="5" fill="#f4e7c5" />
        <rect x="3" y="4" width="5" height="1" fill="#215c45" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 14" className="h-10 w-12" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="7" y="8" width="2" height="5" fill="#6b3f22" />
      <rect x="3" y="5" width="10" height="4" fill="#2f6b45" />
      <rect x="4" y="2" width="8" height="4" fill="#3f8f55" />
      <rect x="6" y="0" width="4" height="3" fill="#8fce73" />
    </svg>
  );
}
