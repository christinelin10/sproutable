import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { GardenWorld } from "@/components/game/garden-world";
import { QuestCard } from "@/components/game/quest-card";
import { StoryCard } from "@/components/game/story-card";
import { XpMeter } from "@/components/game/xp-meter";
import { getCurrentUser } from "@/lib/auth";
import { recentStories } from "@/lib/community";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { managesGarden } from "@/lib/permissions";
import { progressFor } from "@/lib/progression";
import { pickLocalized } from "@/lib/text";
import type { Language } from "@/lib/types";

export default async function HomePage() {
  const t = await getTranslations("home");
  const world = await getTranslations("world");
  const progress = await getTranslations("progress");
  const eventsT = await getTranslations("events");
  const gardensT = await getTranslations("gardens");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const user = await getCurrentUser();
  const gardens = [...db.gardens].sort((a, b) => a.name.localeCompare(b.name));
  const managed = user ? gardens.filter((garden) => managesGarden(db, user.user_id, garden.garden_id)) : [];
  const stats = user ? progressFor(db, user.user_id) : null;
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
        .map((item) => {
          const title = pickLocalized(locale, item.event.title_en, item.event.title_es);
          const body = pickLocalized(locale, item.event.description_en, item.event.description_es);
          return {
            id: `${item.eventId}-${item.date}`,
            title: title.text,
            detail: body.text.replace(/\s+/g, " ").slice(0, 140),
            when: DateTime.fromISO(item.start).setLocale(locale).toFormat("ccc LLL d, t"),
            start: item.start,
            garden: garden.name,
            category: eventsT(item.event.category),
            href: `/events?quest=${item.eventId}&date=${item.date}#upcoming`,
          };
        }),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);
  const stories = recentStories(db, 3);
  const nextLevelId = stats?.levelId === "sprout" ? "visitor" : stats?.levelId === "visitor" ? "helper" : stats?.levelId === "helper" ? "gardener" : "steward";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <GardenWorld
        eyebrow={world("eyebrow")}
        title={world("title")}
        body={world("body")}
        sceneLabel={world("scene")}
        bloom={stats ? stats.level - 1 : 1}
        meter={
          stats ? (
            <XpMeter
              levelLabel={progress("level", { level: stats.level })}
              title={progress(`levels.${stats.levelId}`)}
              xpLabel={progress("xp", { xp: stats.xp })}
              nextLabel={stats.nextLevelXp === null ? progress("maxLevel") : progress("xpToNext", { xp: stats.nextLevelXp - stats.xp, title: progress(`levels.${nextLevelId}`) })}
              value={stats.span === 0 ? 1 : stats.intoLevel}
              max={stats.span === 0 ? 1 : stats.span}
            />
          ) : (
            <div>
              <p className="font-game text-xl">{world("guestTitle")}</p>
              <p className="mt-1 text-sm text-muted">{world("guest")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/login?next=/" className="game-btn inline-flex min-h-11 items-center bg-[#215c45] px-3 font-semibold text-[#f7f3ea]">
                  {world("login")}
                </Link>
                <Link href="/signup" className="game-btn inline-flex min-h-11 items-center bg-[#fffdf8] px-3 font-semibold">
                  {world("signup")}
                </Link>
              </div>
            </div>
          )
        }
        doors={[
          { kind: "map", href: "/map", kicker: world("mapKicker"), title: world("mapTitle"), detail: world("mapDetail") },
          { kind: "events", href: "/events", kicker: world("eventsKicker"), title: world("eventsTitle"), detail: world("eventsDetail") },
          { kind: "growing", href: "/growing", kicker: world("growingKicker"), title: world("growingTitle"), detail: world("growingDetail") },
          { kind: "progress", href: "/achievements", kicker: world("progressKicker"), title: world("progressTitle"), detail: world("progressDetail") },
          { kind: "gardener", href: user ? "/gardener" : "/login?next=/gardener", kicker: world("gardenerKicker"), title: world("gardenerTitle"), detail: world("gardenerDetail") },
        ]}
      />

      {managed.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-game text-2xl">{t("yourGardens")}</h2>
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

      <section className="mt-10" aria-labelledby="home-quests">
        <div className="flex items-end justify-between gap-3">
          <h2 id="home-quests" className="font-game text-3xl">
            {world("quests")}
          </h2>
          <Link href="/events" className="font-semibold text-primary underline">
            {t("allEvents")}
          </Link>
        </div>
        {upcoming.length === 0 ? <p className="mt-4 text-muted">{world("questsEmpty")}</p> : null}
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {upcoming.map((item) => (
            <li key={item.id}>
              <QuestCard garden={item.garden} title={item.title} when={item.when} detail={item.detail} category={item.category} href={item.href} action={world("joinQuest")} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="home-stories">
        <h2 id="home-stories" className="font-game text-3xl">
          {world("stories")}
        </h2>
        {stories.length === 0 ? <p className="mt-4 text-muted">{world("storiesEmpty")}</p> : null}
        <ul className="mt-4 grid gap-3 lg:grid-cols-3">
          {stories.map((story) => (
            <li key={story.entry.entry_id}>
              <StoryCard
                href={story.href}
                author={story.author}
                garden={story.gardenName}
                crop={story.entry.crop || story.bedLabel}
                when={DateTime.fromISO(story.entry.entry_date).setLocale(locale).toFormat("ccc LLL d")}
                text={story.entry.text}
                action={world("openStory")}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-game text-3xl">{t("featured")}</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {gardens.map((garden) => (
            <li key={garden.garden_id} className="rounded-2xl border border-line bg-card p-4">
              <Link href={`/gardens/${garden.slug}`} className="block">
                <span className="block text-xl font-semibold">{garden.name}</span>
                <span className="mt-1 block text-muted">{garden.neighborhood}</span>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/gardens/${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-3 font-semibold">
                  {t("visit")}
                </Link>
                <Link href={`/events?garden=${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line px-3 font-semibold">
                  {t("openCalendar")}
                </Link>
                {user && managesGarden(db, user.user_id, garden.garden_id) ? (
                  <Link href={`/manage/${garden.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-primary px-3 font-semibold text-primary-foreground">
                    {gardensT("manage")}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 mb-4 max-w-3xl">
        <h2 className="text-3xl font-semibold">{t("feedbackTitle")}</h2>
        <p className="mt-3 text-lg text-muted">{t("feedbackBody")}</p>
        <Link href="/feedback" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline">
          {t("feedbackAction")}
        </Link>
      </section>
    </div>
  );
}
