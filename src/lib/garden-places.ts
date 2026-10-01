/** Real coordinates for satellite covers. Hamburg Hall and the map list live in nearby-gardens.ts. */

export const GARDEN_PLACES: Record<string, { lat: number; lng: number; label: string }> = {
  "beechview-community-garden": {
    lat: 40.4118,
    lng: -80.0249,
    label: "1229 Rockland Ave, Beechview",
  },
  "riverside-community-garden": {
    lat: 40.4814,
    lng: -79.9598,
    label: "4200 Butler St, Lawrenceville",
  },
  "hilltop-neighborhood-garden": {
    lat: 40.417,
    lng: -79.984,
    label: "1400 Arlington Ave, Allentown",
  },
};

export function gardenPlace(slug: string) {
  return GARDEN_PLACES[slug] ?? null;
}
