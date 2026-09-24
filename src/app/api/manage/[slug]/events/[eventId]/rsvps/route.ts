import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";

function cell(value: string | number | boolean) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await context.params;
  const user = await getCurrentUser();
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  const event = db.events.find((item) => item.event_id === eventId && item.garden_id === garden?.garden_id);
  if (!garden || !event) return NextResponse.json({ error: "missing" }, { status: 404 });
  if (!user || !managesGarden(db, user.user_id, garden.garden_id)) return NextResponse.json({ error: "denied" }, { status: 403 });
  const date = new URL(request.url).searchParams.get("date");
  const rows = db.rsvps.filter((row) => row.event_id === event.event_id && row.status === "going" && (!date || row.occurrence_date === date));
  const lines = [["name", "email", "date", "party_size", "volunteer", "note"].join(",")];
  for (const row of rows) {
    lines.push([cell(row.name), cell(row.email), cell(row.occurrence_date), cell(row.party_size), cell(row.volunteer), cell(row.note)].join(","));
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.event_id}-rsvps.csv"`,
    },
  });
}
