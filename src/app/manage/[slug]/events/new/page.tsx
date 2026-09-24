import { DateTime } from "luxon";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/event-form";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import type { EventInput } from "@/server/garden-actions";

export default async function NewEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const { date } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const initial: EventInput = {
    title_en: "",
    title_es: "",
    description_en: "",
    description_es: "",
    category: "workday",
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : DateTime.now().setZone(garden.timezone).toISODate()!,
    start_time: "10:00",
    end_time: "12:00",
    all_day: false,
    location: garden.address,
    visibility: "public",
    capacity: null,
    repeat: "none",
    weekdays: [],
    ends: "until",
    until: "",
    count: 8,
  };
  return (
    <section className="max-w-2xl">
      <EventForm slug={slug} initial={initial} />
    </section>
  );
}
