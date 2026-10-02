import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { pickLocalized } from "@/lib/text";
import { toggleVolunteerOffer } from "@/server/social-actions";
import type { Language } from "@/lib/types";

export default async function VolunteerPage() {
  const t = await getTranslations("volunteerPage");
  const events = await getTranslations("events");
  const locale = (await getLocale()) as Language;
  const user = await getCurrentUser();
  const db = await readDb();
  const shifts = db.gardens.flatMap((garden) => {
    const now = DateTime.now().setZone(garden.timezone).startOf("day");
    return expandEvents(
      db.events.filter((event) => event.garden_id === garden.garden_id && event.visibility === "public" && event.status === "active" && event.category === "workday"),
      db.eventExceptions,
      garden.timezone,
      now,
      now.plus({ days: 45 }),
    )
      .filter((item) => !item.cancelled)
      .map((item) => ({
        garden,
        item,
        title: pickLocalized(locale, item.event.title_en, item.event.title_es).text,
        helping: Boolean(
          user &&
            (db.volunteerOffers ?? []).some(
              (offer) => offer.user_id === user.user_id && offer.event_id === item.eventId && offer.occurrence_date === item.date,
            ),
        ),
      }));
  }).sort((a, b) => a.item.date.localeCompare(b.item.date) || a.garden.name.localeCompare(b.garden.name));

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-game text-4xl text-[#3d2914]">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("body")}</p>
      {!user ? (
        <p className="mt-4">
          <Link href="/login?next=%2Fvolunteer" className="font-semibold text-primary underline">{t("signIn")}</Link>
        </p>
      ) : null}
      {shifts.length === 0 ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <ul className="mt-6 space-y-3">
        {shifts.slice(0, 16).map(({ garden, item, title, helping }) => (
          <li key={`${item.eventId}-${item.date}`} className="game-panel bg-[#fffdf8] p-4">
            <p className="text-sm font-semibold text-primary">{garden.name}</p>
            <h2 className="font-game text-2xl">{title}</h2>
            <p className="mt-1 text-sm font-semibold">
              {DateTime.fromISO(item.date).setLocale(locale).toLocaleString(DateTime.DATE_MED)} · {events("workday")}
            </p>
            <p className="mt-1 text-sm text-muted">{item.event.location}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user ? (
                <form action={toggleVolunteerOffer}>
                  <input type="hidden" name="garden_id" value={garden.garden_id} />
                  <input type="hidden" name="event_id" value={item.eventId} />
                  <input type="hidden" name="date" value={item.date} />
                  <input type="hidden" name="next" value="/volunteer" />
                  <button type="submit" className={`min-h-11 rounded-full px-4 font-semibold ${helping ? "bg-[#3f8f55] text-white" : "border border-line bg-card"}`}>
                    {helping ? t("helping") : t("help")}
                  </button>
                </form>
              ) : (
                <Link href="/login?next=%2Fvolunteer" className="game-btn inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
                  {t("help")}
                </Link>
              )}
              <Link href={`/gardens/${garden.slug}`} className="inline-flex min-h-11 items-center font-semibold text-primary underline">
                {t("garden")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
