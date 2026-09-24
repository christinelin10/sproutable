import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { EventForm } from "@/components/event-form";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { cancelSeries } from "@/server/garden-actions";
import type { EventInput } from "@/server/garden-actions";
import type { Language } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function EditEventPage({ params }: { params: Promise<{ slug: string; eventId: string }> }) {
  const { slug, eventId } = await params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  const event = db.events.find((item) => item.event_id === eventId && item.garden_id === garden?.garden_id);
  if (!garden || !event) notFound();
  const t = await getTranslations("events");
  const locale = (await getLocale()) as Language;
  const [date, start] = event.start_datetime.split("T");
  const end = event.end_datetime.split("T")[1]?.slice(0, 5) ?? "12:00";
  const count = Number(event.recurrence_rule.match(/COUNT=(\d+)/)?.[1] ?? 8);
  const days = (event.recurrence_rule.match(/BYDAY=([A-Z,]+)/)?.[1] ?? "").split(",").filter(Boolean) as EventInput["weekdays"];
  const repeat: EventInput["repeat"] = !event.recurrence_rule
    ? "none"
    : event.recurrence_rule.includes("DAILY")
      ? "daily"
      : event.recurrence_rule.includes("MONTHLY")
        ? "monthly"
        : event.recurrence_rule.includes("INTERVAL=2")
          ? "biweekly"
          : "weekly";
  const initial: EventInput = {
    title_en: event.title_en,
    title_es: event.title_es,
    description_en: event.description_en,
    description_es: event.description_es,
    category: event.category,
    date,
    start_time: start?.slice(0, 5) ?? "10:00",
    end_time: end,
    all_day: event.all_day,
    location: event.location,
    visibility: event.visibility,
    capacity: event.capacity,
    repeat,
    weekdays: days,
    ends: event.recurrence_rule.includes("COUNT=") ? "count" : "until",
    until: event.recurrence_until,
    count,
  };
  const rsvps = db.rsvps.filter((row) => row.event_id === event.event_id && row.status === "going");
  const dates = [...new Set(rsvps.map((row) => row.occurrence_date))];

  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <EventForm slug={slug} initial={initial} eventId={event.event_id} />
      <div>
        <form action={cancelSeries.bind(null, slug, event.event_id)}>
          <button className="rounded-full bg-[#8d2f2f] px-4 py-2 font-semibold text-white" type="submit">
            {t("cancelSeries")}
          </button>
        </form>
        <h2 className="mt-8 text-2xl font-semibold">{t("rsvps")}</h2>
        {dates.length === 0 ? <p className="mt-3 text-muted">{t("noRsvps")}</p> : null}
        {dates.map((day) => {
          const rows = rsvps.filter((row) => row.occurrence_date === day);
          const total = rows.reduce((sum, row) => sum + row.party_size, 0);
          return (
            <div key={day} className="mt-4">
              <p className="font-semibold">
                {formatDate(day, locale, garden.timezone)} · {t("headcount")}: {total}
              </p>
              <a className="text-sm font-semibold text-primary" href={`/api/manage/${slug}/events/${event.event_id}/rsvps?date=${day}`}>
                {t("export")}
              </a>
              <ul className="mt-2 space-y-2">
                {rows.map((row) => (
                  <li key={row.rsvp_id} className="rounded-2xl bg-card p-3">
                    {row.name} · {row.email} · {row.party_size}
                    {row.volunteer ? ` · ${t("volunteerFlag")}` : ""}
                    {row.note ? <span className="block text-sm text-muted">{row.note}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        <Link href={`/gardens/${slug}/events`} className="mt-6 inline-block font-semibold text-primary">
          {t("title")}
        </Link>
      </div>
    </section>
  );
}
