const photos = {
  tomato: "/photos/tomato.jpg",
  basil: "/photos/basil.jpg",
  lettuce: "/photos/lettuce.jpg",
  beds: "/photos/beds.jpg",
  garden: "/photos/garden.jpg",
} as const;

/** Reference photos for crops. These are real photographs, not drawings of the bed. */
export function cropPhoto(crop: string) {
  const name = crop.toLowerCase();
  if (name.includes("tomato")) return photos.tomato;
  if (name.includes("basil") || name.includes("herb")) return photos.basil;
  if (name.includes("lettuce")) return photos.lettuce;
  if (name.includes("pepper") || name.includes("strawberry")) return photos.tomato;
  if (!name) return photos.garden;
  return photos.beds;
}
