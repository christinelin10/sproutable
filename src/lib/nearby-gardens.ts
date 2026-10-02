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
  favorite?: boolean;
  visited?: boolean;
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
    id: "hilltop",
    name: "Hilltop Neighborhood Garden",
    neighborhood: "Allentown",
    address: "1400 Arlington Ave, Pittsburgh, PA 15210",
    lat: 40.417,
    lng: -79.984,
    slug: "hilltop-neighborhood-garden",
  },
  {
    id: "riverside",
    name: "Riverside Community Garden",
    neighborhood: "Lawrenceville",
    address: "4200 Butler St, Pittsburgh, PA 15201",
    lat: 40.4814,
    lng: -79.9598,
    slug: "riverside-community-garden",
  },
  {
    id: "beechview",
    name: "Beechview Community Garden",
    neighborhood: "Beechview",
    address: "1229 Rockland Ave, Pittsburgh, PA 15216",
    lat: 40.41482,
    lng: -80.01998,
    slug: "beechview-community-garden",
  },
  {
    id: "larimer",
    name: "Larimer Community Garden",
    neighborhood: "Larimer",
    address: "413 Larimer Ave, Pittsburgh, PA 15206",
    lat: 40.46443,
    lng: -79.91551,
  },
  {
    id: "garfield",
    name: "Garfield Community Farm",
    neighborhood: "Garfield",
    address: "527 Edlam Way, Pittsburgh, PA 15224",
    lat: 40.46902,
    lng: -79.93503,
  },
  {
    id: "highland",
    name: "Highland Park Community Garden",
    neighborhood: "Highland Park",
    address: "1145 N Highland Ave, Pittsburgh, PA 15206",
    lat: 40.4786,
    lng: -79.9162,
  },
  {
    id: "sheridan",
    name: "Sheridan Avenue Orchard",
    neighborhood: "East Liberty",
    address: "Sheridan Ave, Pittsburgh, PA 15206",
    lat: 40.4664,
    lng: -79.9204,
  },
  {
    id: "homewood",
    name: "Homewood Community Garden",
    neighborhood: "Homewood",
    address: "718 N Homewood Ave, Pittsburgh, PA 15208",
    lat: 40.4562,
    lng: -79.8964,
  },
  {
    id: "thomas",
    name: "Thomas Boulevard Community Garden",
    neighborhood: "Point Breeze",
    address: "Thomas Blvd, Pittsburgh, PA 15208",
    lat: 40.4516,
    lng: -79.9082,
  },
  {
    id: "landslide",
    name: "Landslide Community Farm",
    neighborhood: "Hill District",
    address: "Centre Ave, Pittsburgh, PA 15219",
    lat: 40.4462,
    lng: -79.9788,
  },
  {
    id: "dreamz",
    name: "Garden Dreamz",
    neighborhood: "Hill District",
    address: "Centre Ave, Pittsburgh, PA 15219",
    lat: 40.4438,
    lng: -79.9725,
  },
  {
    id: "bidwell",
    name: "Bidwell Community Garden",
    neighborhood: "North Side",
    address: "Bidwell St, Pittsburgh, PA 15233",
    lat: 40.4569,
    lng: -80.0104,
  },
  {
    id: "manchester",
    name: "Manchester Community Garden",
    neighborhood: "Manchester",
    address: "Manhattan St, Pittsburgh, PA 15233",
    lat: 40.4522,
    lng: -80.0262,
  },
  {
    id: "troy",
    name: "Troy Hill Community Garden",
    neighborhood: "Troy Hill",
    address: "Lowrie St, Pittsburgh, PA 15212",
    lat: 40.4684,
    lng: -79.9812,
  },
  {
    id: "polish",
    name: "Polish Hill Community Garden",
    neighborhood: "Polish Hill",
    address: "Brereton St, Pittsburgh, PA 15219",
    lat: 40.4558,
    lng: -79.9654,
  },
  {
    id: "bloomfield",
    name: "Bloomfield Community Garden",
    neighborhood: "Bloomfield",
    address: "Liberty Ave, Pittsburgh, PA 15224",
    lat: 40.4615,
    lng: -79.9492,
  },
  {
    id: "morningside",
    name: "Morningside Community Garden",
    neighborhood: "Morningside",
    address: "Morningside Ave, Pittsburgh, PA 15206",
    lat: 40.4822,
    lng: -79.9284,
  },
  {
    id: "stanton",
    name: "Stanton Heights Garden",
    neighborhood: "Stanton Heights",
    address: "Stanton Ave, Pittsburgh, PA 15206",
    lat: 40.4781,
    lng: -79.9396,
  },
  {
    id: "eastlib",
    name: "East Liberty Garden",
    neighborhood: "East Liberty",
    address: "Penn Ave, Pittsburgh, PA 15206",
    lat: 40.4612,
    lng: -79.9255,
  },
  {
    id: "squirrel",
    name: "Squirrel Hill Garden Plots",
    neighborhood: "Squirrel Hill",
    address: "Bartlett St, Pittsburgh, PA 15217",
    lat: 40.4324,
    lng: -79.9226,
  },
  {
    id: "greenfield",
    name: "Greenfield Community Garden",
    neighborhood: "Greenfield",
    address: "Greenfield Ave, Pittsburgh, PA 15207",
    lat: 40.4232,
    lng: -79.9324,
  },
  {
    id: "southside",
    name: "South Side Community Garden",
    neighborhood: "South Side",
    address: "Sarah St, Pittsburgh, PA 15203",
    lat: 40.4264,
    lng: -79.9752,
  },
  {
    id: "beltzhoover",
    name: "Beltzhoover Community Garden",
    neighborhood: "Beltzhoover",
    address: "Estella Ave, Pittsburgh, PA 15210",
    lat: 40.4162,
    lng: -79.9954,
  },
  {
    id: "carrick",
    name: "Carrick Community Garden",
    neighborhood: "Carrick",
    address: "Brownsville Rd, Pittsburgh, PA 15210",
    lat: 40.3984,
    lng: -79.9782,
  },
  {
    id: "brookline",
    name: "Brookline Community Garden",
    neighborhood: "Brookline",
    address: "Brookline Blvd, Pittsburgh, PA 15226",
    lat: 40.3942,
    lng: -80.0204,
  },
  {
    id: "sheraden",
    name: "Sheraden Community Garden",
    neighborhood: "Sheraden",
    address: "Sherwood Ave, Pittsburgh, PA 15204",
    lat: 40.4552,
    lng: -80.0582,
  },
  {
    id: "westend",
    name: "West End Community Garden",
    neighborhood: "West End",
    address: "Wabash St, Pittsburgh, PA 15220",
    lat: 40.4412,
    lng: -80.0342,
  },
  {
    id: "lemington",
    name: "Lincoln-Lemington Garden",
    neighborhood: "Lincoln-Lemington",
    address: "Lincoln Ave, Pittsburgh, PA 15206",
    lat: 40.4682,
    lng: -79.8952,
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
