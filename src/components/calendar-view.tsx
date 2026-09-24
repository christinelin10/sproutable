"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DateTime } from "luxon";
import { useTranslations } from "next-intl";
import { cancelOccurrence, rsvpToEvent } from "@/server/garden-actions";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";

export type CalendarItem = {
  eventId: string;
  date: string;
  start: string;
  end: string;
  cancelled: boolean;
  locked: boolean;
  title: string;
  description: string;
  category: string;
  location: string;
  capacity: number | null;
  going: number;
  allDay: boolean;
  fallback: boolean;
  viewerName: string;
  viewerEmail: string;
  loggedIn: boolean;
};

const colors: Record<string, string> = {
  workday: "bg-emerald-100 text-emerald-950",
  workshop: "bg-sky-100 text-sky-950",
  meal: "bg-amber-100 text-amber-950",
  meeting: "bg-violet-100 text-violet-950",
  other: "bg-stone-200 text-stone-900",
};

export function CalendarView({
  slug,
  month,
  locale,
  zone,
  items,
  canManage,
  listItems,
}: {
  slug: string;
  month: string;
  locale: string;
  zone: string;
  items: CalendarItem[];
  canManage: boolean;
  listItems: CalendarItem[];
}) {
  const t = useTranslations("events");
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [rsvpOpen, setRsvp] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const cursor = DateTime.fromISO(`${month}-01`, { zone });
  const start = cursor.startOf("month").startOf("week").minus({ days: cursor.startOf("month").weekday % 7 === 0 ? 0 : 0 });
  const gridStart = cursor.startOf("month").minus({ days: cursor.startOf("month").weekday % 7 });
  const days = Array.from({ length: 42 }, (_, index) => gridStart.plus({ days: index }));
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);
  const prev = cursor.minus({ months: 1 }).toFormat("yyyy-MM");
  const next = cursor.plus({ months: 1 }).toFormat("yyyy-MM");
  const today = DateTime.now().setZone(zone).toISODate();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={`/gardens/${slug}/events?month=${prev}`}>
          {t("prev")}
        </a>
        <h1 className="text-3xl font-semibold">{cursor.setLocale(locale).toFormat("LLLL yyyy")}</h1>
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={`/gardens/${slug}/events?month=${next}`}>
          {t("next")}
        </a>
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={`/gardens/${slug}/events?month=${DateTime.now().setZone(zone).toFormat("yyyy-MM")}`}>
          {t("today")}
        </a>
        {canManage ? (
          <Link href={`/manage/${slug}/events/new`} className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
            {t("new")}
          </Link>
        ) : null}
      </div>
      <div className="mt-6 hidden gap-1 md:grid md:grid-cols-7">
        {days.map((day) => {
          const key = day.toISODate()!;
          const inMonth = day.month === cursor.month;
          return (
            <div key={key} className={`min-h-28 rounded-2xl border p-2 ${day.toISODate() === today ? "border-primary" : "border-line"} ${inMonth ? "bg-card" : "bg-transparent opacity-60"}`}>
              <p className="text-sm font-semibold">{day.setLocale(locale).toFormat("d")}</p>
              {(byDate.get(key) ?? []).map((item) => (
                <button
                  key={`${item.eventId}-${item.date}`}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setRsvp(false);
                    setMessage("");
                  }}
                  className={`mt-1 block w-full rounded-lg px-2 py-1 text-left text-sm ${item.locked ? "bg-stone-200" : colors[item.category]} ${item.cancelled ? "line-through" : ""}`}
                >
                  {item.locked ? t("membersOnly") : item.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <ul className="mt-6 space-y-3 md:hidden">
        {listItems.length === 0 ? <li className="text-muted">{t("empty")}</li> : null}
        {listItems.map((item) => (
          <li key={`${item.eventId}-${item.date}-list`}>
            <button type="button" className="w-full rounded-2xl border border-line bg-card p-4 text-left" onClick={() => setSelected(item)}>
              <span className={`rounded-full px-2 py-0.5 text-sm ${item.locked ? "bg-stone-200" : colors[item.category]}`}>
                {item.locked ? t("membersOnly") : t(item.category as "workday")}
              </span>
              <span className={`mt-2 block text-xl font-semibold ${item.cancelled ? "line-through" : ""}`}>
                {item.locked ? t("membersOnly") : item.title}
              </span>
              <span className="text-muted">{DateTime.fromISO(item.start).setLocale(locale).toLocaleString(DateTime.DATETIME_MED)}</span>
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <Modal
          title={selected.locked ? t("membersOnly") : selected.title}
          onClose={() => {
            setSelected(null);
            setRsvp(false);
          }}
        >
          {selected.locked ? (
            <p>
              {selected.loggedIn ? t("joinPrompt") : t("loginPrompt")}{" "}
              <Link className="font-semibold text-primary" href={selected.loggedIn ? `/gardens/${slug}` : `/login?next=/gardens/${slug}/events`}>
                {selected.loggedIn ? t("joinPrompt") : t("loginPrompt")}
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              <p className={`inline-block rounded-full px-2 py-0.5 text-sm ${colors[selected.category]}`}>{t(selected.category as "workday")}</p>
              {selected.fallback ? <p className="text-sm text-muted">{t("titleEs")}</p> : null}
              <p>{DateTime.fromISO(selected.start).setLocale(locale).toLocaleString(DateTime.DATETIME_MED)}</p>
              <p>{selected.location}</p>
              <p className="whitespace-pre-wrap">{selected.description}</p>
              {selected.cancelled ? <p className="font-semibold">{t("cancelled")}</p> : null}
              {selected.capacity ? (
                <p>
                  {Math.max(selected.capacity - selected.going, 0)} {t("spots")}
                </p>
              ) : null}
              {!selected.cancelled && selected.capacity !== null && selected.going >= selected.capacity ? <p>{t("full")}</p> : null}
              {!selected.cancelled && (selected.capacity === null || selected.going < selected.capacity) ? (
                <Button type="button" onClick={() => setRsvp(true)}>
                  {t("rsvp")}
                </Button>
              ) : null}
              {message ? <p role="status">{message}</p> : null}
              {rsvpOpen ? (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const result = await rsvpToEvent({
                      slug,
                      eventId: selected.eventId,
                      date: selected.date,
                      name: String(data.get("name")),
                      email: String(data.get("email")),
                      partySize: Number(data.get("party")),
                      volunteer: data.get("volunteer") === "on",
                      note: String(data.get("note") ?? ""),
                    });
                    if (result?.error) setError(result.error);
                    else setMessage(t("sent"));
                  }}
                >
                  <label className="block">
                    {t("name")}
                    <input name="name" required defaultValue={selected.viewerName} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
                  </label>
                  <label className="block">
                    {t("email")}
                    <input name="email" type="email" required defaultValue={selected.viewerEmail} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
                  </label>
                  <label className="block">
                    {t("people")}
                    <input name="party" type="number" min={1} max={10} defaultValue={1} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
                  </label>
                  <label className="flex gap-2">
                    <input type="checkbox" name="volunteer" /> {t("volunteer")}
                  </label>
                  <label className="block">
                    {t("rsvpNote")}
                    <textarea name="note" className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
                  </label>
                  {error ? <p className="text-[#8d2f2f]">{error}</p> : null}
                  <Button type="submit">{t("confirm")}</Button>
                </form>
              ) : null}
              {message ? (
                <a className="block font-semibold text-primary" href={`/api/events/${selected.eventId}/ics?date=${selected.date}&slug=${slug}`}>
                  {t("addCalendar")}
                </a>
              ) : null}
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-full border border-line px-3 py-2" href={`/manage/${slug}/events/${selected.eventId}`}>
                    {t("edit")}
                  </Link>
                  <form action={cancelOccurrence.bind(null, slug, selected.eventId, selected.date)}>
                    <button className="rounded-full border border-line px-3 py-2" type="submit">
                      {t("cancelOne")}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </Modal>
      ) : null}
      <p className="sr-only">{start.toISODate()}</p>
    </div>
  );
}
