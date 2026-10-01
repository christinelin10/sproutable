import { NextResponse } from "next/server";
import { gardenPlace } from "@/lib/garden-places";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const place = gardenPlace(slug);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!place || !token) return NextResponse.json({ error: "unavailable" }, { status: 404 });

  const { lng, lat } = place;
  const overlay = `pin-s+215c45(${lng},${lat})`;
  const src = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${overlay}/${lng},${lat},17,0/800x480@2x?access_token=${encodeURIComponent(token)}`;
  const image = await fetch(src);
  if (!image.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });

  return new NextResponse(image.body, {
    headers: {
      "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
