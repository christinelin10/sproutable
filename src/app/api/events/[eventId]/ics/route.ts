import { DateTime } from "luxon";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";

export async function GET(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";
  const db = await readDb();
  const event = db.events.find((item) => item.event_id === eventId);
  if (!event) return new Response("Missing event", { status: 404 });
  const garden = db.gardens.find((item) => item.garden_id === event.garden_id);
  const zone = garden?.timezone ?? "America/New_York";
  const windowStart = DateTime.fromISO(date, { zone }).startOf("day");
  const matches = expandEvents([event], db.eventExceptions, zone, windowStart, windowStart.endOf("day"));
  const occurrence = matches.find((item) => item.date === date) ?? matches[0];
  if (!occurrence) return new Response("Missing date", { status: 404 });
  const start = DateTime.fromISO(occurrence.start, { zone }).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const end = DateTime.fromISO(occurrence.end, { zone }).toUTC().toFormat("yyyyLLdd'T'HHmmss'Z'");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sproutable//EN",
    "BEGIN:VEVENT",
    `UID:${event.event_id}-${date}@sproutable`,
    `DTSTAMP:${DateTime.utc().toFormat("yyyyLLdd'T'HHmmss'Z'")}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title_en.replace(/\n/g, " ")}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${date}.ics"`,
    },
  });
}
