import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { pickLocalized } from "@/lib/text";
import { toggleSavedEvent } from "@/server/social-actions";
import type { Language } from "@/lib/types";

export default async function SavedEventsPage() {
  const t = await getTranslations("savedPage");
  const events = await getTranslations("events");
  const locale = (await getLocale()) as Language;
  const user = await getCurrentUser();
  const db = await readDb();
  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-game text-4xl text-[#3d2914]">{t("title")}</h1>
        <p className="mt-3 text-lg text-muted">{t("signedOut")}</p>
        <Link href="/login?next=%2Fsaved" className="game-btn mt-6 inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
          {t("signIn")}
        </Link>
      </section>
    );
  }

  const going = db.rsvps.filter((rsvp) => rsvp.user_id === user.user_id && rsvp.status === "going");
  const saved = (db.savedEvents ?? []).filter((item) => item.user_id === user.user_id);
  const rows = [
    ...going.map((rsvp) => ({ id: rsvp.rsvp_id, eventId: rsvp.event_id, date: rsvp.occurrence_date, kind: "going" as const })),
    ...saved
      .filter((item) => !going.some((rsvp) => rsvp.event_id === item.event_id && rsvp.occurrence_date === item.occurrence_date))
      .map((item) => ({ id: item.save_id, eventId: item.event_id, date: item.occurrence_date, kind: "saved" as const })),
  ].flatMap((row) => {
    const event = db.events.find((item) => item.event_id === row.eventId && item.status === "active");
    const garden = event ? db.gardens.find((item) => item.garden_id === event.garden_id) : undefined;
    if (!event || !garden) return [];
    return [{ ...row, event, garden, title: pickLocalized(locale, event.title_en, event.title_es).text }];
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-game text-4xl text-[#3d2914]">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("body")}</p>
      {rows.length === 0 ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <ul className="mt-6 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="game-panel bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-primary">{row.garden.name}</p>
            <h2 className="font-game text-2xl">{row.title}</h2>
            <p className="mt-1 text-sm font-semibold">
              {DateTime.fromISO(row.date).setLocale(locale).toLocaleString(DateTime.DATE_MED)} · {events(row.event.category)}
            </p>
            <p className="mt-1 text-sm text-muted">{row.kind === "going" ? t("going") : t("interested")}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/events?garden=${row.garden.slug}&quest=${row.event.event_id}&date=${row.date}#upcoming`} className="game-btn inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
                {t("open")}
              </Link>
              {row.kind === "saved" ? (
                <form action={toggleSavedEvent}>
                  <input type="hidden" name="event_id" value={row.eventId} />
                  <input type="hidden" name="date" value={row.date} />
                  <input type="hidden" name="next" value="/saved" />
                  <button type="submit" className="min-h-11 rounded-full border border-line px-4 font-semibold">{t("remove")}</button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
