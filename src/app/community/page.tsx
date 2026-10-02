import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { TranslateText } from "@/components/translate-text";
import { getCurrentUser } from "@/lib/auth";
import { acceptedBuddyIds, peopleNear } from "@/lib/buddies";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { pickLocalized } from "@/lib/text";
import { createCommunityPost, quickJoin } from "@/server/community-actions";
import { inviteBuddy } from "@/server/social-actions";
import type { Language } from "@/lib/types";

export default async function CommunityPage() {
  const t = await getTranslations("community");
  const eventsT = await getTranslations("events");
  const locale = (await getLocale()) as Language;
  const user = await getCurrentUser();
  const db = await readDb();
  const now = DateTime.now().setZone("America/New_York").startOf("day");
  const upcoming = db.gardens
    .flatMap((garden) =>
      expandEvents(
        db.events.filter((event) => event.garden_id === garden.garden_id && event.visibility === "public" && event.status === "active"),
        db.eventExceptions,
        garden.timezone,
        now.setZone(garden.timezone),
        now.setZone(garden.timezone).plus({ days: 45 }),
      )
        .filter((item) => !item.cancelled)
        .map((item) => ({
          garden,
          item,
          title: pickLocalized(locale, item.event.title_en, item.event.title_es).text,
          mine: Boolean(
            user &&
              db.rsvps.some(
                (rsvp) =>
                  rsvp.user_id === user.user_id &&
                  rsvp.event_id === item.eventId &&
                  rsvp.occurrence_date === item.date &&
                  rsvp.status === "going",
              ),
          ),
        })),
    )
    .sort((a, b) => a.item.date.localeCompare(b.item.date) || a.title.localeCompare(b.title));

  const mine = upcoming.filter((row) => row.mine);
  const buddyIds = user ? new Set(acceptedBuddyIds(db.buddyLinks ?? [], user.user_id)) : new Set<string>();
  const buddies = [...buddyIds].flatMap((id) => {
    const person = db.users.find((item) => item.user_id === id);
    return person ? [person] : [];
  });
  const neighbors = user ? peopleNear(db, user.user_id).filter((person) => !buddyIds.has(person.id)).slice(0, 6) : [];
  const posts = [...(db.communityPosts ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 12);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <p className="font-semibold text-primary">{t("eyebrow")}</p>
      <h1 className="mt-1 font-game text-4xl text-[#3d2914] sm:text-5xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{t("body")}</p>
      <p className="mt-3 text-sm text-muted">{t("chatNote")}</p>
      <p className="mt-3">
        <Link href="/events" className="font-semibold text-primary underline">{t("calendar")}</Link>
      </p>

      <h2 className="mt-8 font-game text-3xl text-[#3d2914]">{t("mineTitle")}</h2>
      {mine.length === 0 ? <p className="mt-2 text-muted">{user ? t("mineEmpty") : t("mineGuest")}</p> : null}
      <ul className="mt-3 space-y-3">
        {mine.map((row) => (
          <Quest key={`${row.item.eventId}-${row.item.date}`} row={row} locale={locale} eventsT={eventsT} t={t} buddies={buddies} db={db} />
        ))}
      </ul>

      <h2 className="mt-8 font-game text-3xl text-[#3d2914]">{t("questsTitle")}</h2>
      <p className="mt-1 text-muted">{t("questsHint")}</p>
      <ul className="mt-3 space-y-3">
        {upcoming.filter((row) => !row.mine).slice(0, 12).map((row) => (
          <Quest key={`${row.item.eventId}-${row.item.date}`} row={row} locale={locale} eventsT={eventsT} t={t} buddies={buddies} db={db} />
        ))}
      </ul>

      <h2 className="mt-10 font-game text-3xl text-[#3d2914]">{t("postsTitle")}</h2>
      <p className="mt-1 text-muted">{t("postsBody")}</p>
      {user ? (
        <form action={createCommunityPost} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold">
            {t("postGarden")}
            <select name="garden_id" className="mt-1 block w-full rounded-xl border border-line bg-card px-3 py-2">
              <option value="">{t("anyGarden")}</option>
              {db.gardens.map((garden) => (
                <option key={garden.garden_id} value={garden.garden_id}>{garden.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            {t("postLabel")}
            <textarea name="body" required maxLength={500} rows={3} className="mt-1 block w-full rounded-xl border border-line px-3 py-2" />
          </label>
          <button type="submit" className="game-btn min-h-11 bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">{t("post")}</button>
        </form>
      ) : (
        <p className="mt-3"><Link href="/login?next=/community" className="font-semibold text-primary underline">{t("loginPost")}</Link></p>
      )}
      <ul className="mt-4 space-y-3">
        {posts.length === 0 ? <li className="text-muted">{t("postsEmpty")}</li> : null}
        {posts.map((post) => {
          const author = db.users.find((item) => item.user_id === post.user_id);
          const garden = db.gardens.find((item) => item.garden_id === post.garden_id);
          return (
            <li key={post.post_id} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-sm font-semibold text-primary">{author?.name}{garden ? ` · ${garden.name}` : ""}</p>
              <p className="mt-1 whitespace-pre-wrap">{post.body}</p>
              <TranslateText text={post.body} label={t("translate")} toEnglish={locale === "en"} />
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 font-game text-3xl text-[#3d2914]">{t("buddiesTitle")}</h2>
      <p className="mt-1 text-muted">{t("buddiesBody")}</p>
      {!user ? <p className="mt-3"><Link href="/login?next=/community" className="font-semibold text-primary underline">{t("loginBuddies")}</Link></p> : null}
      {buddies.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {buddies.map((person) => (
            <li key={person.user_id} className="rounded-full bg-[#e7f3dc] px-3 py-1 font-semibold text-[#215c45]">{person.name}</li>
          ))}
        </ul>
      ) : user ? <p className="mt-3 text-muted">{t("buddiesEmpty")}</p> : null}
      {user && neighbors.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {neighbors.map((person) => (
            <li key={person.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line p-3">
              <span className="font-semibold">{person.name}</span>
              <form action={inviteBuddy}>
                <input type="hidden" name="user_id" value={person.id} />
                <button type="submit" className="min-h-11 rounded-full bg-[#e3b23c] px-4 font-semibold text-[#3d2914]">{t("ask")}</button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-4">
        <Link href="/buddies" className="font-semibold text-primary underline">{t("openBuddies")}</Link>
      </p>
    </section>
  );
}

function Quest({
  row,
  locale,
  eventsT,
  t,
  buddies,
  db,
}: {
  row: {
    garden: { slug: string; name: string; garden_id: string };
    item: { eventId: string; date: string; start: string; event: { category: string; location: string } };
    title: string;
    mine: boolean;
  };
  locale: Language;
  eventsT: (key: string) => string;
  t: (key: string) => string;
  buddies: { user_id: string; name: string }[];
  db: { rsvps: { user_id: string; event_id: string; occurrence_date: string; status: string }[] };
}) {
  const withBuddies = buddies.filter((person) =>
    db.rsvps.some(
      (rsvp) => rsvp.user_id === person.user_id && rsvp.event_id === row.item.eventId && rsvp.occurrence_date === row.item.date && rsvp.status === "going",
    ),
  );
  const quest = row.item.event.category === "workday";
  return (
    <li className="game-panel bg-[#fffdf8] p-4">
      {quest ? <p className="text-sm font-semibold text-primary">{t("quest")}</p> : null}
      <h3 className="font-game text-2xl text-[#3d2914]">{row.title}</h3>
      <p className="mt-1 text-sm font-semibold">
        {row.garden.name} · {DateTime.fromISO(row.item.start, { setZone: true }).setLocale(locale).toFormat("ccc LLL d, t")}
      </p>
      <p className="text-sm text-muted">{eventsT(row.item.event.category)} · {row.item.event.location}</p>
      {withBuddies.length > 0 ? <p className="mt-1 text-sm">{t("withBuddies")} {withBuddies.map((person) => person.name).join(", ")}</p> : null}
      <form action={quickJoin} className="mt-3">
        <input type="hidden" name="slug" value={row.garden.slug} />
        <input type="hidden" name="event_id" value={row.item.eventId} />
        <input type="hidden" name="date" value={row.item.date} />
        <input type="hidden" name="volunteer" value={quest ? "1" : "0"} />
        {row.mine ? <input type="hidden" name="cancel" value="1" /> : null}
        <button type="submit" className={`min-h-11 rounded-full px-4 font-semibold ${row.mine ? "border border-line" : "bg-[#215c45] text-[#f7f3ea]"}`}>
          {row.mine ? t("cancel") : t("join")}
        </button>
      </form>
    </li>
  );
}
