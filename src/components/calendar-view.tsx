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
  mine: boolean;
  viewerName: string;
  viewerEmail: string;
  loggedIn: boolean;
  slug?: string;
  gardenName?: string;
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
  basePath,
  extraQuery = "",
  returnTo,
  signInToRsvp = false,
}: {
  slug: string;
  month: string;
  locale: string;
  zone: string;
  items: CalendarItem[];
  canManage: boolean;
  listItems: CalendarItem[];
  basePath?: string;
  extraQuery?: string;
  returnTo?: string;
  signInToRsvp?: boolean;
}) {
  const t = useTranslations("events");
  const errors = useTranslations("errors");
  const [view, setView] = useState<"month" | "list">("month");
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
  const path = basePath ?? `/gardens/${slug}/events`;
  function monthHref(value: string) {
    const query = new URLSearchParams(extraQuery);
    query.set("month", value);
    return `${path}?${query}`;
  }
  function eventSlug(item: CalendarItem) {
    return item.slug ?? slug;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={monthHref(prev)}>
          {t("prev")}
        </a>
        <h1 className="text-3xl font-semibold">{cursor.setLocale(locale).toFormat("LLLL yyyy")}</h1>
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={monthHref(next)}>
          {t("next")}
        </a>
        <a className="rounded-full border border-line px-3 py-2 font-semibold" href={monthHref(DateTime.now().setZone(zone).toFormat("yyyy-MM"))}>
          {t("today")}
        </a>
        {canManage ? (
          <Link href={`/manage/${slug}/events/new`} className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
            {t("new")}
          </Link>
        ) : null}
        <button type="button" aria-pressed={view === "month"} className={`rounded-full px-3 py-2 font-semibold ${view === "month" ? "bg-primary text-primary-foreground" : "border border-line"}`} onClick={() => setView("month")}>
          {t("month")}
        </button>
        <button type="button" aria-pressed={view === "list"} className={`rounded-full px-3 py-2 font-semibold ${view === "list" ? "bg-primary text-primary-foreground" : "border border-line"}`} onClick={() => setView("list")}>
          {t("list")}
        </button>
      </div>
      {view === "month" ? (
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-muted">
            {days.slice(0, 7).map((day) => (
              <div key={day.toISODate()}>{day.setLocale(locale).toFormat("ccc")}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = day.toISODate()!;
              const inMonth = day.month === cursor.month;
              return (
                <div key={key} className={`min-h-24 rounded-2xl border p-1 sm:min-h-28 sm:p-2 ${day.toISODate() === today ? "border-primary" : "border-line"} ${inMonth ? "bg-card" : "opacity-50"}`}>
                  {canManage ? (
                    <Link href={`/manage/${slug}/events/new?date=${key}`} className="text-sm font-semibold">
                      {day.setLocale(locale).toFormat("d")}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">{day.setLocale(locale).toFormat("d")}</p>
                  )}
                  {(byDate.get(key) ?? []).map((item) => (
                    <button
                      key={`${item.eventId}-${item.date}`}
                      type="button"
                      onClick={() => {
                        setSelected(item);
                        setRsvp(false);
                        setMessage("");
                        setError("");
                      }}
                      aria-label={`${item.gardenName ? `${item.gardenName}, ` : ""}${item.locked ? t("membersOnly") : item.title}, ${item.date}`}
                      className={`mt-1 block w-full rounded-lg px-1 py-1 text-left text-xs sm:text-sm ${item.locked ? "bg-stone-200" : colors[item.category]} ${item.cancelled ? "line-through" : ""}`}
                    >
                      {item.gardenName ? <span className="block truncate font-semibold">{item.gardenName}</span> : null}
                      {item.locked ? t("membersOnly") : item.title}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {listItems.length === 0 ? <li className="text-muted">{t("empty")}</li> : null}
          {listItems.map((item) => (
            <li key={`${item.eventId}-${item.date}-list`}>
              <button
                type="button"
                className="w-full rounded-2xl border border-line bg-card p-4 text-left"
                onClick={() => {
                  setSelected(item);
                  setRsvp(false);
                  setMessage("");
                  setError("");
                }}
              >
                <span className={`rounded-full px-2 py-0.5 text-sm ${item.locked ? "bg-stone-200" : colors[item.category]}`}>
                  {item.locked ? t("membersOnly") : t(item.category as "workday")}
                </span>
                <span className={`mt-2 block text-xl font-semibold ${item.cancelled ? "line-through" : ""}`}>
                  {item.gardenName ? `${item.gardenName} · ` : ""}
                  {item.locked ? t("membersOnly") : item.title}
                </span>
                <span className="text-muted">{DateTime.fromISO(item.start).setLocale(locale).toLocaleString(DateTime.DATETIME_MED)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
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
              {selected.fallback ? <p className="text-sm text-muted">{t("englishOnly")}</p> : null}
              <p>{DateTime.fromISO(selected.start).setLocale(locale).toLocaleString(DateTime.DATETIME_MED)}</p>
              <p>{selected.location}</p>
              <p className="whitespace-pre-wrap">{selected.description}</p>
              {selected.cancelled ? <p className="font-semibold">{t("cancelled")}</p> : null}
              {selected.mine ? <p className="font-semibold">{t("going")}</p> : null}
              {selected.capacity ? (
                <p>
                  {Math.max(selected.capacity - selected.going, 0)} {t("spots")}
                </p>
              ) : null}
              {!selected.cancelled && !selected.mine && selected.capacity !== null && selected.going >= selected.capacity ? <p>{t("full")}</p> : null}
              {!selected.cancelled && !selected.mine && (selected.capacity === null || selected.going < selected.capacity) ? (
                signInToRsvp && !selected.loggedIn ? (
                  <Link className="inline-block rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground" href={`/login?next=${encodeURIComponent(returnTo || path)}`}>
                    {t("signInToGo")}
                  </Link>
                ) : (
                  <Button type="button" onClick={() => setRsvp(true)}>
                    {t("rsvp")}
                  </Button>
                )
              ) : null}
              {selected.mine ? (
                <form
                  action={async () => {
                    await rsvpToEvent({
                      slug: eventSlug(selected),
                      eventId: selected.eventId,
                      date: selected.date,
                      name: selected.viewerName,
                      email: selected.viewerEmail,
                      partySize: 1,
                      volunteer: false,
                      note: "",
                      cancel: true,
                    });
                    setSelected(null);
                  }}
                >
                  <Button type="submit" variant="ghost">
                    {t("cancelRsvp")}
                  </Button>
                </form>
              ) : null}
              {message ? <p role="status">{message}</p> : null}
              {rsvpOpen ? (
                <form
                  className="space-y-3"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const result = await rsvpToEvent({
                      slug: eventSlug(selected),
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
                  {error ? <p className="text-[#8d2f2f]">{errors(error as "full")}</p> : null}
                  <Button type="submit">{t("confirm")}</Button>
                </form>
              ) : null}
              {(message || selected.mine) && !selected.cancelled ? (
                <a className="block font-semibold text-primary" href={`/api/events/${selected.eventId}/ics?date=${selected.date}&slug=${eventSlug(selected)}`}>
                  {t("addCalendar")}
                </a>
              ) : null}
              {!selected.locked ? (
                <a className="block font-semibold text-primary" href={`/api/events/${selected.eventId}/flyer?date=${selected.date}`}>
                  {t("flyer")}
                </a>
              ) : null}
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-full border border-line px-3 py-2" href={`/manage/${eventSlug(selected)}/events/${selected.eventId}`}>
                    {t("edit")}
                  </Link>
                  <Link className="rounded-full border border-line px-3 py-2" href={`/manage/${eventSlug(selected)}/events/${selected.eventId}?date=${selected.date}`}>
                    {t("editDate")}
                  </Link>
                  <form action={cancelOccurrence.bind(null, eventSlug(selected), selected.eventId, selected.date)}>
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
