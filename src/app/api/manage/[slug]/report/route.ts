import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { impactSummary, periodRange, type PeriodKey } from "@/lib/impact";
import { gardenBySlug, managesGarden } from "@/lib/permissions";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const user = await getCurrentUser();
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) return NextResponse.json({ error: "missing" }, { status: 404 });
  if (!user || !managesGarden(db, user.user_id, garden.garden_id)) {
    return NextResponse.json({ error: "denied" }, { status: 403 });
  }
  const url = new URL(request.url);
  const period = (url.searchParams.get("period") ?? "season") as PeriodKey;
  const range = periodRange(period, garden.timezone, url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const summary = impactSummary(db, garden.garden_id, range.from, range.to);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "pdf";

  if (format === "csv") {
    const lines = ["type,date,user_id,source,amount,unit"];
    for (const visit of summary.visitRows) {
      lines.push(["visit", visit.visited_at, visit.user_id, visit.source, "", ""].join(","));
    }
    for (const entry of summary.harvestRows) {
      lines.push(["harvest", entry.entry_date, entry.user_id, entry.crop, String(entry.harvest_amount ?? ""), entry.harvest_unit].join(","));
    }
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${garden.slug}-impact.csv"`,
      },
    });
  }

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const draw = (text: string, x: number, y: number, size = 12, heavy = false) => {
    page.drawText(text.replace(/[^\x20-\x7E]/g, ""), { x, y, size, font: heavy ? bold : font, color: rgb(0.13, 0.22, 0.18) });
  };
  draw(garden.name, 48, 740, 22, true);
  draw(`Grant report · ${range.from.toISODate()} to ${range.to.toISODate()}`, 48, 710, 12);
  const cards = [
    ["Visits", summary.visits],
    ["Events", summary.eventsHeld],
    ["RSVPs", summary.rsvpCount],
    ["Members", summary.activeMembers],
    ["Harvest lb", summary.harvestLb],
  ];
  cards.forEach(([label, value], index) => {
    const x = 48 + (index % 3) * 170;
    const y = index < 3 ? 640 : 560;
    page.drawRectangle({ x, y, width: 150, height: 60, color: rgb(0.95, 0.93, 0.88) });
    draw(String(label), x + 12, y + 36, 11);
    draw(String(value), x + 12, y + 14, 18, true);
  });
  draw("Visits per month", 48, 520, 14, true);
  const max = Math.max(1, ...summary.visitsByMonth.map((row) => row.visits));
  summary.visitsByMonth.slice(-8).forEach((row, index) => {
    const height = (row.visits / max) * 120;
    page.drawRectangle({ x: 48 + index * 60, y: 360, width: 36, height, color: rgb(0.13, 0.36, 0.27) });
    draw(row.month.slice(5), 48 + index * 60, 340, 9);
  });
  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${garden.slug}-grant-report.pdf"`,
    },
  });
}
