import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarView, type CalendarItem } from "@/components/calendar-view";
import { Markdown } from "@/components/markdown";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { unreadCount } from "@/lib/inbox";
import { canSeeMembersContent, managesGarden } from "@/lib/permissions";
import { pickLocalized } from "@/lib/text";
import type { Garden, Language } from "@/lib/types";

const categories = ["workday", "workshop", "meal", "meeting", "other"] as const;

export default async function EventsPage({ searchParams }: {
  searchParams: Promise<{ month?: string; garden?: string; category?: string; view?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("eventBoard");
  const events = await getTranslations("events");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const user = await getCurrentUser();
  const gardens = [...db.gardens].sort((a, b) =>
    Number(b.slug === "beechview-community-garden") - Number(a.slug === "beechview-community-garden") || a.name.localeCompare(b.name));
  const selected = gardens.find(garden => garden.slug === params.garden);
  const category = categories.find(value => value === params.category) ?? "";
  const zone = selected?.timezone ?? gardens[0]?.timezone ?? "America/New_York";
  const now = DateTime.now().setZone(zone);
  const requested = params.month && /^\d{4}-\d{2}$/.test(params.month)
    ? DateTime.fromISO(`${params.month}-01`, { zone }) : now;
  const cursor = (requested.isValid ? requested : now).startOf("month");
  const shown = selected ? [selected] : gardens;
  function itemsFor(garden: Garden, from: DateTime, to: DateTime): CalendarItem[] {
    return expandEvents(
      db.events.filter((event) => event.garden_id === garden.garden_id && (event.visibility === "public" || canSeeMembersContent(db, user?.user_id ?? null, garden.garden_id)) && (!category || event.category === category)),
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

  const query = new URLSearchParams();
  if (selected) query.set("garden", selected.slug);
  if (category) query.set("category", category);
  const monthItems = shown.flatMap(garden => itemsFor(garden, cursor.minus({ days: 7 }), cursor.endOf("month").plus({ days: 14 })))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const upcoming = shown.flatMap(garden => itemsFor(garden, now.startOf("day"), now.plus({ months: 3 })))
    .filter(item => Date.parse(item.end) >= now.toMillis())
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const notices = db.announcements.filter(item =>
    shown.some(garden => garden.garden_id === item.garden_id) &&
    (item.visibility === "public" || canSeeMembersContent(db, user?.user_id ?? null, item.garden_id)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at));
  const managed = shown.filter(garden => user && managesGarden(db, user.user_id, garden.garden_id));
  const unread = user ? unreadCount(db, user) : 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <header className="rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-widest">{t("eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-2xl text-lg">{t("intro")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#upcoming" className="rounded-full bg-card px-5 py-3 font-semibold text-primary">{t("explore")}</a>
          <Link href={user ? "/inbox" : "/login?next=%2Fevents"} className="rounded-full border border-white/50 px-5 py-3 font-semibold">
            {user ? t("inbox", { count: unread }) : t("signIn")}
          </Link>
        </div>
      </header>
      <form action="/events" className="my-6 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-card p-5">
        <input type="hidden" name="month" value={cursor.toFormat("yyyy-MM")} />
        <label className="w-full min-w-0 font-semibold sm:w-auto sm:flex-1">{t("garden")}
          <select name="garden" defaultValue={selected?.slug ?? ""} className="mt-2 block w-full rounded-xl border border-line bg-card px-3 py-3">
            <option value="">{t("allGardens")}</option>
            {gardens.map(garden => <option key={garden.garden_id} value={garden.slug}>{garden.name}</option>)}
          </select>
        </label>
        <label className="w-full min-w-0 font-semibold sm:w-auto sm:flex-1">{t("category")}
          <select name="category" defaultValue={category} className="mt-2 block w-full rounded-xl border border-line bg-card px-3 py-3">
            <option value="">{t("allTypes")}</option>
            {categories.map(value => <option key={value} value={value}>{events(value)}</option>)}
          </select>
        </label>
        <button className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">{t("filter")}</button>
        <Link href="/events" className="px-2 py-3 font-semibold underline">{t("reset")}</Link>
      </form>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section id="upcoming" className="min-w-0 scroll-mt-28 rounded-3xl border border-line bg-card/80 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold">{t("upcoming")}</h2>
          <p className="mb-5 mt-1 text-muted">{t("window")}</p>
          <CalendarView slug={selected?.slug ?? ""} month={cursor.toFormat("yyyy-MM")} locale={locale} zone={zone}
            items={monthItems} listItems={upcoming} canManage={false} basePath="/events" extraQuery={query.toString()}
            returnTo={`/events?${query.toString()}`} signInToRsvp initialView={params.view === "month" ? "month" : "list"} />
        </section>
        <aside className="space-y-5">
          {managed.length > 0 ? <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="text-xl font-semibold">{t("organize")}</h2>
            {managed.map(garden => <div key={garden.garden_id} className="mt-4">
              <p className="font-semibold">{garden.name}</p>
              <Link className="mt-2 block text-primary underline" href={`/manage/${garden.slug}/events/new`}>{t("create")}</Link>
              <Link className="mt-2 block text-primary underline" href={`/manage/${garden.slug}/announcements`}>{t("post")}</Link>
            </div>)}
          </section> : null}
          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="text-2xl font-semibold">{t("notices")}</h2>
            <p className="mt-2 text-sm text-muted">{t("noticesIntro")}</p>
            {notices.length === 0 ? <p className="mt-5 text-muted">{t("emptyNotices")}</p> : null}
            <div className="mt-5 space-y-5">
              {notices.map(item => {
                const garden = gardens.find(garden => garden.garden_id === item.garden_id)!;
                const title = pickLocalized(locale, item.title_en, item.title_es);
                const body = pickLocalized(locale, item.body_en, item.body_es);
                return <article key={item.announcement_id} className="border-t border-line pt-4">
                  {item.pinned ? <p className="text-xs font-bold uppercase tracking-wide text-accent">{t("pinned")}</p> : null}
                  <h3 className="mt-1 text-lg font-semibold">{title.text}</h3>
                  <Link href={`/gardens/${garden.slug}`} className="text-sm text-primary underline">{garden.name}</Link>
                  <time dateTime={item.created_at} className="mt-1 block text-sm text-muted">{DateTime.fromISO(item.created_at).setZone(garden.timezone).setLocale(locale).toLocaleString(DateTime.DATE_MED)}</time>
                  {title.fallback || body.fallback ? <p className="mt-2 text-sm text-muted">{events("englishOnly")}</p> : null}
                  <div className="mt-3 break-words text-sm"><Markdown text={body.text} /></div>
                </article>;
              })}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
