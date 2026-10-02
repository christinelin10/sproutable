import { DateTime } from "luxon";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { canSeeMembersContent, gardenBySlug, managesGarden } from "@/lib/permissions";
import { pickLocalized } from "@/lib/text";
import type { Language } from "@/lib/types";

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { slug } = await params;
  const { month } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const user = await getCurrentUser();
  const locale = (await getLocale()) as Language;
  const zone = garden.timezone;
  const cursor = month && /^\d{4}-\d{2}$/.test(month) ? DateTime.fromISO(`${month}-01`, { zone }) : DateTime.now().setZone(zone).startOf("month");
  const member = user ? canSeeMembersContent(db, user.user_id, garden.garden_id) : false;
  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const occurrences = expandEvents(
    db.events.filter((event) => event.garden_id === garden.garden_id),
    db.eventExceptions,
    zone,
    cursor.startOf("month").minus({ days: 7 }),
    cursor.endOf("month").plus({ days: 7 }),
  );
  const list = expandEvents(
    db.events.filter((event) => event.garden_id === garden.garden_id),
    db.eventExceptions,
    zone,
    DateTime.now().setZone(zone).startOf("day"),
    DateTime.now().setZone(zone).plus({ months: 3 }),
  );

  const toItem = (item: (typeof occurrences)[number]): CalendarItem => {
    const locked = item.event.visibility === "members" && !member;
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
      locked,
      title: locked ? "" : localized.text,
      description: locked ? "" : body.text,
      category: item.event.category,
      location: locked ? "" : item.event.location,
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
      saved: Boolean(user && (db.savedEvents ?? []).some((saved) => saved.user_id === user.user_id && saved.event_id === item.eventId && saved.occurrence_date === item.date)),
    };
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <CalendarView
        slug={slug}
        month={cursor.toFormat("yyyy-MM")}
        locale={locale}
        zone={zone}
        items={occurrences.map(toItem)}
        listItems={list.map(toItem)}
        canManage={manager}
      />
    </section>
  );
}
