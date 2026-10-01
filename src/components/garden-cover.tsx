import { gardenPlace } from "@/lib/garden-places";

export function GardenCover({
  slug,
  fallback,
  alt,
  className,
  credit,
}: {
  slug: string;
  fallback: string;
  alt: string;
  className: string;
  credit: string;
}) {
  const place = gardenPlace(slug);
  if (!place) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fallback} alt={alt} className={className} />
    );
  }
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/place-image?slug=${encodeURIComponent(slug)}`} alt={alt || place.label} className={className} />
      <figcaption className="bg-card px-3 py-1 text-xs text-muted">{credit}</figcaption>
    </figure>
  );
}
