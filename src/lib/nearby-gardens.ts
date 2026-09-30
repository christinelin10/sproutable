/** Mock map points. Hamburg Hall is the stand-in for "you are here" until location is real. */

export const HOME_BASE = {
  name: "Hamburg Hall, Carnegie Mellon University",
  address: "4800 Forbes Ave, Pittsburgh, PA 15213",
  lat: 40.444431,
  lng: -79.945629,
};

export type NearbyGarden = {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  /** Set when this garden already has a Sproutable page. */
  slug?: string;
};

export const NEARBY_GARDENS: NearbyGarden[] = [
  {
    id: "winthrop",
    name: "Winthrop Street Community Garden",
    neighborhood: "Oakland",
    address: "4636 Winthrop St, Pittsburgh, PA 15213",
    lat: 40.44215,
    lng: -79.95085,
  },
  {
    id: "oakland",
    name: "Oakland Garden",
    neighborhood: "Oakland",
    address: "246 Oakland Ave, Pittsburgh, PA 15213",
    lat: 40.44037,
    lng: -79.9558,
  },
  {
    id: "parkview",
    name: "South Oakland Community Orchard",
    neighborhood: "South Oakland",
    address: "3213 Parkview Ave, Pittsburgh, PA 15213",
    lat: 40.4318,
    lng: -79.9594,
  },
  {
    id: "frazier",
    name: "Frazier Farms Community Garden",
    neighborhood: "South Oakland",
    address: "3638 Frazier St, Pittsburgh, PA 15213",
    lat: 40.4294,
    lng: -79.9651,
  },
  {
    id: "hazelwood",
    name: "Hazelwood Community Garden",
    neighborhood: "Hazelwood",
    address: "4727 Chatsworth Ave, Pittsburgh, PA 15207",
    lat: 40.4089,
    lng: -79.9418,
  },
  {
    id: "beechview",
    name: "Beechview Community Garden",
    neighborhood: "Beechview",
    address: "1229 Rockland Ave, Pittsburgh, PA 15216",
    lat: 40.4118,
    lng: -80.0249,
    slug: "beechview-community-garden",
  },
];

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
