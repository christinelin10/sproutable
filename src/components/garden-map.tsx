"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyGarden } from "@/lib/nearby-gardens";
import { HOME_BASE, milesBetween } from "@/lib/nearby-gardens";

export function GardenMap({
  token,
  gardens,
  selectedId,
  onSelect,
  youAreHere,
  live,
  liveLabel,
  focusLive,
  missingToken,
}: {
  token: string;
  gardens: NearbyGarden[];
  selectedId: string;
  onSelect: (id: string) => void;
  youAreHere: string;
  live: { lat: number; lng: number } | null;
  liveLabel: string;
  focusLive: number;
  missingToken: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const liveMarker = useRef<mapboxgl.Marker | null>(null);
  const lastFocus = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!token || !container.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [HOME_BASE.lng, HOME_BASE.lat],
      zoom: 12,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([HOME_BASE.lng, HOME_BASE.lat]);

    const you = document.createElement("button");
    you.type = "button";
    you.className = "map-pin map-pin-you";
    you.setAttribute("aria-label", youAreHere);
    you.title = youAreHere;
    new mapboxgl.Marker({ element: you, anchor: "center" }).setLngLat([HOME_BASE.lng, HOME_BASE.lat]).addTo(map);

    for (const garden of gardens) {
      bounds.extend([garden.lng, garden.lat]);
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "map-pin map-pin-garden";
      pin.dataset.gardenId = garden.id;
      pin.setAttribute("aria-label", garden.slug ? `${garden.name}. Open garden page` : garden.name);
      pin.title = garden.name;
      pin.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current(garden.id);
        if (garden.slug) routerRef.current.push(`/gardens/${garden.slug}`);
      });
      new mapboxgl.Marker({ element: pin, anchor: "center" }).setLngLat([garden.lng, garden.lat]).addTo(map);
    }

    map.on("load", () => {
      map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
      setMapReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      liveMarker.current = null;
      setMapReady(false);
    };
  }, [gardens, token, youAreHere]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !live) return;
    if (!liveMarker.current) {
      const dot = document.createElement("div");
      dot.className = "map-pin map-pin-live";
      dot.setAttribute("role", "img");
      dot.setAttribute("aria-label", liveLabel);
      liveMarker.current = new mapboxgl.Marker({ element: dot, anchor: "center" }).setLngLat([live.lng, live.lat]).addTo(map);
    } else {
      liveMarker.current.setLngLat([live.lng, live.lat]);
      liveMarker.current.getElement().setAttribute("aria-label", liveLabel);
    }
    if (focusLive !== lastFocus.current) {
      lastFocus.current = focusLive;
      const miles = milesBetween(HOME_BASE.lat, HOME_BASE.lng, live.lat, live.lng);
      if (miles < 15) {
        const bounds = new mapboxgl.LngLatBounds([live.lng, live.lat], [live.lng, live.lat]);
        bounds.extend([HOME_BASE.lng, HOME_BASE.lat]);
        for (const garden of gardens) bounds.extend([garden.lng, garden.lat]);
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 800 });
      } else {
        map.flyTo({ center: [live.lng, live.lat], zoom: 15, essential: true });
      }
    }
  }, [focusLive, live, liveLabel, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pins = map.getContainer().querySelectorAll<HTMLButtonElement>(".map-pin-garden");
    pins.forEach((pin) => {
      const selected = pin.dataset.gardenId === selectedId;
      pin.classList.toggle("map-pin-selected", selected);
      pin.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    const garden = gardens.find((item) => item.id === selectedId);
    if (!garden) return;
    map.flyTo({ center: [garden.lng, garden.lat], zoom: 14, essential: true });
  }, [gardens, selectedId]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-3xl border border-line bg-card p-6 text-center">
        <p className="max-w-sm text-muted">{missingToken}</p>
      </div>
    );
  }

  return <div ref={container} className="h-full min-h-[420px] w-full" />;
}
