import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BadgeCard } from "@/components/game/badge-card";
import { GardenerSprite } from "@/components/game/gardener-sprite";
import { XpMeter } from "@/components/game/xp-meter";
import { getCurrentUser } from "@/lib/auth";
import { gardenBuddies } from "@/lib/community";
import { readDb } from "@/lib/data/store";
import { badgeIds, badgeState, progressFor, xpAwards } from "@/lib/progression";

const awardKeys = ["visit", "rsvp", "journal", "photo", "harvest"] as const;

export default async function GardenerPage() {
  const t = await getTranslations("gardenerPage");
  const progress = await getTranslations("progress");
  const badges = await getTranslations("badges");
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-game text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("guest")}</p>
        <Link href="/login?next=/gardener" className="game-btn mt-6 inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
          {t("login")}
        </Link>
      </section>
    );
  }

  const db = await readDb();
  const stats = progressFor(db, user.user_id);
  const earned = badgeState(db, user.user_id);
  const buddies = gardenBuddies(db, user.user_id);
  const nextId = stats.levelId === "sprout" ? "visitor" : stats.levelId === "visitor" ? "helper" : stats.levelId === "helper" ? "gardener" : "steward";
  const counts = {
    visit: stats.visits,
    rsvp: stats.rsvps,
    journal: stats.journals,
    photo: stats.photos,
    harvest: stats.harvests,
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link href="/" className="font-semibold text-primary underline">
        {t("home")}
      </Link>
      <div className="mt-4 grid items-center gap-6 lg:grid-cols-[auto_1fr]">
        <div className="game-panel w-fit bg-[#e7f3dc] p-4">
          <GardenerSprite className="h-28 w-28" />
        </div>
        <div>
          <p className="font-semibold text-primary">{user.name}</p>
          <h1 className="mt-1 font-game text-4xl sm:text-5xl">{t("title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{t("body")}</p>
          <div className="mt-4 max-w-md">
            <XpMeter
              levelLabel={progress("level", { level: stats.level })}
              title={progress(`levels.${stats.levelId}`)}
              xpLabel={progress("xp", { xp: stats.xp })}
              nextLabel={stats.nextLevelXp === null ? progress("maxLevel") : progress("xpToNext", { xp: stats.nextLevelXp - stats.xp, title: progress(`levels.${nextId}`) })}
              value={stats.span === 0 ? 1 : stats.intoLevel}
              max={stats.span === 0 ? 1 : stats.span}
            />
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-game text-3xl">{progress("how")}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {awardKeys.map((key) => (
          <li key={key} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-3xl font-semibold text-primary">{counts[key]}</p>
            <p className="mt-1 font-semibold">{progress(key)}</p>
            <p className="text-sm text-muted">{progress("xpEach", { xp: xpAwards[key] })}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-game text-3xl">{badges("title")}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badgeIds.map((id) => (
          <li key={id}>
            <BadgeCard name={badges(`${id}.name`)} detail={badges(`${id}.detail`)} earned={earned[id]} status={earned[id] ? badges("earned") : badges("locked")} />
          </li>
        ))}
      </ul>

      <h2 className="mt-10 font-game text-3xl">{t("buddies")}</h2>
      <p className="mt-2 max-w-2xl text-muted">{t("buddiesBody")}</p>
      {buddies.length === 0 ? <p className="mt-4 text-muted">{t("buddiesEmpty")}</p> : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {buddies.map((buddy) => (
          <li key={buddy.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center gap-3">
              <GardenerSprite className="h-12 w-12" />
              <p className="font-game text-2xl">{buddy.name}</p>
            </div>
            {buddy.crop ? <p className="mt-3 font-semibold">{buddy.crop}</p> : null}
            {buddy.text ? <p className="mt-1 text-muted">{buddy.text}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
