import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents, nextPublicOccurrence } from "@/lib/events";
import { managesGarden } from "@/lib/permissions";
import { pickLocalized } from "@/lib/text";
import type { Language } from "@/lib/types";

export default async function HomePage() {
  const t = await getTranslations("home");
  const hub = await getTranslations("welcomeHub");
  const gardensT = await getTranslations("gardens");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const user = await getCurrentUser();
  const gardens = [...db.gardens].sort((a, b) => a.name.localeCompare(b.name));
  const managed = user ? gardens.filter((garden) => managesGarden(db, user.user_id, garden.garden_id)) : [];
  const now = DateTime.now().setZone("America/New_York");
  const upcoming = gardens
    .flatMap((garden) =>
      expandEvents(
        db.events.filter((event) => event.garden_id === garden.garden_id && event.visibility === "public"),
        db.eventExceptions,
        garden.timezone,
        now,
        now.plus({ days: 21 }),
      )
        .filter((item) => !item.cancelled)
        .map((item) => ({
          id: `${item.eventId}-${item.date}`,
          title: pickLocalized(locale, item.event.title_en, item.event.title_es).text,
          when: DateTime.fromISO(item.start).setLocale(locale).toFormat("ccc LLL d, t"),
          start: item.start,
          garden: garden.name,
          slug: garden.slug,
        })),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 6);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-8 sm:pt-12">
        <p className="font-semibold text-primary">{hub("eyebrow")}</p>
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{hub("title")}</h1>
        <p className="mt-4 max-w-2xl text-xl text-muted">{hub("body")}</p>
        <nav className="mt-8" aria-label={hub("navigation")}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["map", "events", "growing", "achievements"] as const).map((door) => (
              <li key={door}>
                <Link href={`/${door}`} className="flex h-full flex-col rounded-3xl border border-line bg-card p-5 shadow-sm hover:border-primary sm:p-6">
                  <h2 className="text-2xl font-semibold text-primary">{hub(`${door}.title`)}</h2>
                  <p className="mt-3 text-muted">{hub(`${door}.body`)}</p>
                  <span className="mt-auto block pt-6 font-semibold text-primary">{hub(`${door}.action`)} <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="font-semibold text-primary">{t("eyebrow")}</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight">{t("title")}</h2>
        <p className="mt-5 max-w-2xl text-xl text-muted">{t("body")}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/gardens" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground">
            {t("find")}
          </Link>
          <Link href="/calendar" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-accent px-4 py-3 text-center font-semibold text-accent-foreground">
            {t("openCalendar")}
          </Link>
          <Link href={user ? "/dashboard" : "/signup?type=manager"} className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-line bg-card px-4 py-3 text-center font-semibold">
            {t("manage")}
          </Link>
        </div>
      </section>

      {managed.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <h2 className="text-2xl font-semibold">{t("yourGardens")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {managed.map((garden) => (
              <li key={garden.garden_id}>
                <Link href={`/manage/${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground">
                  {garden.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold">{t("upcoming")}</h2>
            <Link href="/calendar" className="font-semibold text-primary underline">
              {t("allEvents")}
            </Link>
          </div>
          {upcoming.length === 0 ? <p className="mt-4 text-muted">{t("emptyEvents")}</p> : null}
          <ul className="mt-4 space-y-3">
            {upcoming.map((item) => (
              <li key={item.id}>
                <Link href={`/calendar?garden=${item.slug}`} className="block rounded-2xl border border-line bg-card p-4 hover:border-primary">
                  <span className="text-sm font-semibold text-primary">{item.garden}</span>
                  <span className="mt-1 block text-xl font-semibold">{item.title}</span>
                  <span className="mt-1 block text-muted">{item.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-semibold">{t("featured")}</h2>
          <ul className="mt-4 space-y-3">
            {gardens.map((garden) => {
              const next = nextPublicOccurrence(
                db.events.filter((event) => event.garden_id === garden.garden_id),
                db.eventExceptions,
                garden.timezone,
              );
              const owns = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
              return (
                <li key={garden.garden_id} className="rounded-2xl border border-line bg-card p-4">
                  <Link href={`/gardens/${garden.slug}`} className="block">
                    <span className="block text-xl font-semibold">{garden.name}</span>
                    <span className="mt-1 block text-muted">
                      {garden.neighborhood}
                      {next ? ` · ${DateTime.fromISO(next.start).setLocale(locale).toFormat("ccc LLL d")}` : ""}
                    </span>
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/gardens/${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-3 font-semibold">
                      {t("visit")}
                    </Link>
                    <Link href={`/calendar?garden=${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-3 font-semibold">
                      {t("openCalendar")}
                    </Link>
                    {owns ? (
                      <Link href={`/manage/${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-primary px-3 font-semibold text-primary-foreground">
                        {gardensT("manage")}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="text-3xl font-semibold">{t("feedbackTitle")}</h2>
        <p className="mt-3 text-lg text-muted">{t("feedbackBody")}</p>
        <Link href="/feedback" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline">
          {t("feedbackAction")}
        </Link>
      </section>
    </div>
  );
}
