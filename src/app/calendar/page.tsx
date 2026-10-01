import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { pickLocalized } from "@/lib/text";
import type { Garden, Language } from "@/lib/types";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; garden?: string }> }) {
  const { month, garden: gardenSlug = "" } = await searchParams;
  const t = await getTranslations("calendar");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const user = await getCurrentUser();
  const gardens = [...db.gardens].sort((a, b) => a.name.localeCompare(b.name));
  const selected = gardens.find((garden) => garden.slug === gardenSlug) ?? null;
  const zone = selected?.timezone ?? gardens[0]?.timezone ?? "America/New_York";
  const cursor = month && /^\d{4}-\d{2}$/.test(month) ? DateTime.fromISO(`${month}-01`, { zone }) : DateTime.now().setZone(zone).startOf("month");
  const shown = selected ? [selected] : gardens;

  function itemsFor(garden: Garden, from: DateTime, to: DateTime): CalendarItem[] {
    return expandEvents(
      db.events.filter((event) => event.garden_id === garden.garden_id && event.visibility === "public"),
      db.eventExceptions,
      garden.timezone,
      from,
      to,
    ).map((item) => {
      const localized = pickLocalized(locale, item.event.title_en, item.event.title_es);
      const body = pickLocalized(locale, item.event.description_en, item.event.description_es);
      const going = db.rsvps
        .filter((rsvp) => rsvp.event_id === item.eventId && rsvp.occurrence_date === item.date && rsvp.status === "going")
        .reduce((sum, rsvp) => sum + rsvp.party_size, 0);
      return {
        eventId: item.eventId,
        date: item.date,
        start: item.start,
        end: item.end,
        cancelled: item.cancelled,
        locked: false,
        title: localized.text,
        description: body.text,
        category: item.event.category,
        location: item.event.location,
        capacity: item.event.capacity,
        going,
        allDay: item.event.all_day,
        fallback: localized.fallback,
        mine: Boolean(
          user &&
            db.rsvps.some(
              (rsvp) =>
                rsvp.event_id === item.eventId &&
                rsvp.occurrence_date === item.date &&
                rsvp.status === "going" &&
                rsvp.email.toLowerCase() === user.email.toLowerCase(),
            ),
        ),
        viewerName: user?.name ?? "",
        viewerEmail: user?.email ?? "",
        loggedIn: Boolean(user),
        slug: garden.slug,
        gardenName: garden.name,
      };
    });
  }

  const monthStart = cursor.startOf("month").minus({ days: 7 });
  const monthEnd = cursor.endOf("month").plus({ days: 7 });
  const listStart = DateTime.now().setZone(zone).startOf("day");
  const listEnd = listStart.plus({ months: 3 });
  const query = new URLSearchParams();
  if (selected) query.set("garden", selected.slug);
  query.set("month", cursor.toFormat("yyyy-MM"));

  return (
    <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[16rem_1fr]">
      <aside>
        <h1 className="text-2xl font-semibold">{t("gardens")}</h1>
        <ul className="mt-3 space-y-1">
          <li>
            <Link href={`/calendar?month=${cursor.toFormat("yyyy-MM")}`} className={`block rounded-2xl px-3 py-2 font-semibold ${selected ? "hover:bg-card" : "bg-primary text-primary-foreground"}`}>
              {t("all")}
            </Link>
          </li>
          {gardens.map((garden) => (
            <li key={garden.garden_id}>
              <Link
                href={`/calendar?garden=${garden.slug}&month=${cursor.toFormat("yyyy-MM")}`}
                className={`block rounded-2xl px-3 py-2 ${selected?.garden_id === garden.garden_id ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-card"}`}
              >
                <span className="font-semibold">{garden.name}</span>
                <span className="block text-sm opacity-80">{garden.neighborhood}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <CalendarView
        slug={selected?.slug ?? gardens[0]?.slug ?? ""}
        month={cursor.toFormat("yyyy-MM")}
        locale={locale}
        zone={zone}
        items={shown.flatMap((garden) => itemsFor(garden, monthStart, monthEnd))}
        listItems={shown.flatMap((garden) => itemsFor(garden, listStart, listEnd))}
        canManage={false}
        basePath="/calendar"
        extraQuery={selected ? `garden=${selected.slug}` : ""}
        returnTo={`/calendar?${query.toString()}`}
        signInToRsvp
      />
    </section>
  );
}
