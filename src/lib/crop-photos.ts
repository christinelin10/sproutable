const photos = {
  beds: "/gardens/beechview/beds.jpg",
  neighbors: "/gardens/beechview/neighbors.jpg",
  harvest: "/gardens/beechview/harvest.jpg",
  dahlias: "/gardens/beechview/dahlias.jpg",
  sign: "/gardens/beechview/sign.jpg",
} as const;

/** Beechview photographs, chosen by what the bed is growing. */
export function cropPhoto(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato") || name.includes("bean") || name.includes("pepper") || name.includes("strawberry")) return photos.harvest;
  if (name.includes("sunflower") || name.includes("flower") || name.includes("dahlia") || name.includes("milkweed")) return photos.dahlias;
  if (name.includes("corn") || name.includes("squash") || name.includes("kale")) return photos.neighbors;
  return photos.beds;
}
