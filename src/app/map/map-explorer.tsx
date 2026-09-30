"use client";

import { useState } from "react";
import Link from "next/link";
import { GardenMap } from "@/components/garden-map";
import { HOME_BASE, type NearbyGarden } from "@/lib/nearby-gardens";

export function MapExplorer({
  token,
  gardens,
  copy,
}: {
  token: string;
  gardens: (NearbyGarden & { miles: number })[];
  copy: {
    youAreHere: string;
    nearby: string;
    miles: string;
    openGarden: string;
    notOnSproutable: string;
    missingToken: string;
    listLabel: string;
    mapLabel: string;
  };
}) {
  const [selectedId, setSelectedId] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start">
      <section className="rounded-3xl border border-line bg-card p-4 lg:max-h-[72vh] lg:overflow-auto" aria-label={copy.listLabel}>
        <h2 className="text-lg font-semibold">{copy.youAreHere}</h2>
        <p className="mt-1 font-semibold">{HOME_BASE.name}</p>
        <p className="text-sm text-muted">{HOME_BASE.address}</p>
        <h2 className="mt-5 text-lg font-semibold">{copy.nearby}</h2>
        <ul className="mt-3 space-y-2">
          {gardens.map((garden) => {
            const selected = garden.id === selectedId;
            return (
              <li key={garden.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedId(garden.id)}
                  className={`w-full rounded-2xl border px-3 py-3 text-left ${selected ? "border-primary bg-primary/10" : "border-line hover:border-primary"}`}
                >
                  <span className="block font-semibold">{garden.name}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {garden.neighborhood} · {garden.miles.toFixed(1)} {copy.miles}
                  </span>
                  <span className="mt-1 block text-sm">{garden.address}</span>
                </button>
                {garden.slug ? (
                  <Link href={`/gardens/${garden.slug}`} className="mt-1 inline-flex min-h-11 items-center px-3 font-semibold text-primary">
                    {copy.openGarden}
                  </Link>
                ) : (
                  <p className="px-3 pt-1 text-sm text-muted">{copy.notOnSproutable}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <section className="overflow-hidden rounded-3xl border border-line bg-card lg:h-[72vh]" aria-label={copy.mapLabel}>
        <GardenMap
          token={token}
          gardens={gardens}
          selectedId={selectedId}
          onSelect={setSelectedId}
          youAreHere={copy.youAreHere}
          missingToken={copy.missingToken}
        />
      </section>
    </div>
  );
}
