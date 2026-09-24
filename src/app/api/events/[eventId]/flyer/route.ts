import { DateTime } from "luxon";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";

export async function GET(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const date = new URL(request.url).searchParams.get("date") ?? "";
  const db = await readDb();
  const event = db.events.find((item) => item.event_id === eventId);
  if (!event) return new Response("Missing event", { status: 404 });
  const garden = db.gardens.find((item) => item.garden_id === event.garden_id);
  const zone = garden?.timezone ?? "America/New_York";
  const windowStart = DateTime.fromISO(date || event.start_datetime, { zone }).startOf("day");
  const matches = expandEvents([event], db.eventExceptions, zone, windowStart, windowStart.endOf("day"));
  const occurrence = matches.find((item) => item.date === date) ?? matches[0];
  const when = occurrence ? DateTime.fromISO(occurrence.start, { zone }).toFormat("cccc, LLLL d · h:mm a") : event.start_datetime;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawRectangle({ x: 0, y: 620, width: 612, height: 172, color: rgb(0.13, 0.36, 0.27) });
  const draw = (value: string, x: number, y: number, size: number, heavy = false, color = rgb(0.12, 0.1, 0.08)) => {
    page.drawText(value.replace(/[^\x20-\x7E]/g, "").slice(0, 90), { x, y, size, font: heavy ? bold : font, color });
  };
  draw(garden?.name ?? "Garden", 48, 730, 16, false, rgb(0.97, 0.95, 0.9));
  draw(occurrence?.event.title_en ?? event.title_en, 48, 680, 28, true, rgb(1, 1, 1));
  draw(when, 48, 560, 16, true);
  draw(occurrence?.event.location ?? event.location, 48, 530, 14);
  const body = (occurrence?.event.description_en ?? event.description_en).replace(/\n/g, " ");
  for (let index = 0; index < 8; index += 1) {
    const slice = body.slice(index * 80, (index + 1) * 80);
    if (!slice) break;
    draw(slice, 48, 480 - index * 22, 13);
  }
  draw("Join us. Tools are on site.", 48, 180, 14, true);
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="flyer-${date || eventId}.pdf"`,
    },
  });
}
