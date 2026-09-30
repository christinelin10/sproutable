"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GardenMap } from "@/components/garden-map";
import { HOME_BASE, milesBetween, type NearbyGarden } from "@/lib/nearby-gardens";

type LiveFix = { lat: number; lng: number };

export function MapExplorer({
  token,
  gardens,
  copy,
}: {
  token: string;
  gardens: (NearbyGarden & { miles: number })[];
  copy: {
    youAreHere: string;
    startingPoint: string;
    liveStart: string;
    liveWaiting: string;
    liveOn: string;
    liveCenter: string;
    liveDenied: string;
    liveUnavailable: string;
    liveUnsupported: string;
    fromYou: string;
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
  const [live, setLive] = useState<LiveFix | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "live" | "denied" | "unavailable" | "unsupported">("idle");
  const [focusLive, setFocusLive] = useState(0);
  const watchId = useRef<number | null>(null);
  const centered = useRef(false);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function shareLocation() {
    if (!navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    if (watchId.current !== null) {
      setFocusLive((value) => value + 1);
      return;
    }
    setStatus("waiting");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLive({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus("live");
        if (!centered.current) {
          centered.current = true;
          setFocusLive(1);
        }
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_1fr] lg:items-start">
      <section className="rounded-3xl border border-line bg-card p-4 lg:max-h-[72vh] lg:overflow-auto" aria-label={copy.listLabel}>
        <h2 className="text-lg font-semibold">{copy.youAreHere}</h2>
        {status === "live" ? <p className="mt-1 text-sm text-muted">{copy.liveOn}</p> : null}
        {status === "waiting" ? <p className="mt-1 text-sm text-muted">{copy.liveWaiting}</p> : null}
        {status === "denied" ? <p className="mt-1 text-sm text-[#8d2f2f]">{copy.liveDenied}</p> : null}
        {status === "unavailable" ? <p className="mt-1 text-sm text-[#8d2f2f]">{copy.liveUnavailable}</p> : null}
        {status === "unsupported" ? <p className="mt-1 text-sm text-[#8d2f2f]">{copy.liveUnsupported}</p> : null}
        <button type="button" onClick={shareLocation} className="mt-3 min-h-11 rounded-full bg-primary px-4 font-semibold text-primary-foreground">
          {status === "live" ? copy.liveCenter : copy.liveStart}
        </button>
        <h2 className="mt-5 text-lg font-semibold">{copy.startingPoint}</h2>
        <p className="mt-1 font-semibold">{HOME_BASE.name}</p>
        <p className="text-sm text-muted">{HOME_BASE.address}</p>
        <h2 className="mt-5 text-lg font-semibold">{copy.nearby}</h2>
        <ul className="mt-3 space-y-2">
          {gardens.map((garden) => {
            const selected = garden.id === selectedId;
            const fromYou = live ? milesBetween(live.lat, live.lng, garden.lat, garden.lng) : null;
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
                    {fromYou !== null ? ` · ${fromYou.toFixed(1)} ${copy.miles} ${copy.fromYou}` : ""}
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
          youAreHere={copy.startingPoint}
          live={live}
          liveLabel={copy.youAreHere}
          focusLive={focusLive}
          missingToken={copy.missingToken}
        />
      </section>
    </div>
  );
}
