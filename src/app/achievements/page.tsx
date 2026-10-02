import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AchievementCard } from "@/components/achievement-card";
import { GrowthTree } from "@/components/game/growth-tree";
import { BadgeCard } from "@/components/game/badge-card";
import { XpMeter } from "@/components/game/xp-meter";
import { achievementCategories, achievementMilestones, participationTotals } from "@/lib/achievements";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { managerAwardIds } from "@/lib/awards";
import { badgeIds, badgeState, emptyBadges, progressFor } from "@/lib/progression";

export default async function AchievementsPage() {
  const t = await getTranslations("achievements");
  const progress = await getTranslations("progress");
  const badges = await getTranslations("badges");
  const awards = await getTranslations("awards");
  const user = await getCurrentUser();
  const db = await readDb();
  const totals = user ? participationTotals(db, user.user_id) : null;
  const stats = user ? progressFor(db, user.user_id) : null;
  const collected = user ? badgeState(db, user.user_id) : emptyBadges();
  const nextLevelId = stats?.levelId === "sprout" ? "visitor" : stats?.levelId === "visitor" ? "helper" : stats?.levelId === "helper" ? "gardener" : "steward";
  const earned = totals ? achievementCategories.reduce(
    (sum, category) => sum + achievementMilestones.filter((target) => totals[category] >= target).length,
    0,
  ) : 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link href="/" className="font-semibold text-primary underline">{t("home")}</Link>
      <h1 className="mt-4 font-game text-4xl tracking-tight sm:text-6xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-xl text-muted">{t("body")}</p>
      <div className="mt-6 rounded-3xl border border-line bg-card p-5">
        <h2 className="font-game text-3xl text-[#3d2914]">{t("growthTitle")}</h2>
        <p className="mt-2 max-w-xl text-muted">{t("growthBody")}</p>
        <div className="mt-4">
          <GrowthTree
            level={stats?.level ?? 1}
            you={stats ? t("you") : t("guestMark")}
            start={t("start")}
            labels={{
              tree: t("stages.tree"),
              youngTree: t("stages.youngTree"),
              sapling: t("stages.sapling"),
              plant: t("stages.plant"),
              young: t("stages.young"),
              sprout: t("stages.sprout"),
            }}
          />
        </div>
      </div>
      {stats ? (
        <div className="mt-6 max-w-md rounded-2xl border border-line bg-card p-4">
          <XpMeter
            levelLabel={progress("level", { level: stats.level })}
            title={progress(`levels.${stats.levelId}`)}
            xpLabel={progress("xp", { xp: stats.xp })}
            nextLabel={stats.nextLevelXp === null ? progress("maxLevel") : progress("xpToNext", { xp: stats.nextLevelXp - stats.xp, title: progress(`levels.${nextLevelId}`) })}
            value={stats.span === 0 ? 1 : stats.intoLevel}
            max={stats.span === 0 ? 1 : stats.span}
          />
          <Link href="/gardener" className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline">{progress("openGardener")}</Link>
        </div>
      ) : null}
      <h2 className="mt-8 font-game text-3xl">{badges("title")}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {badgeIds.map((id) => (
          <li key={id}>
            <BadgeCard name={badges(`${id}.name`)} detail={badges(`${id}.detail`)} earned={collected[id]} status={collected[id] ? badges("earned") : badges("locked")} />
          </li>
        ))}
      </ul>
      <h2 className="mt-8 font-game text-3xl">{awards("title")}</h2>
      <p className="mt-2 max-w-2xl text-muted">{awards("body")}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {managerAwardIds.map((id) => {
          const given = user ? (db.awardedBadges ?? []).filter((award) => award.user_id === user.user_id && award.badge_id === id) : [];
          return (
            <li key={id}>
              <BadgeCard name={awards(`${id}.name`)} detail={given[0]?.note || awards(`${id}.detail`)} earned={given.length > 0} status={given.length > 0 ? awards("fromGarden") : awards("fromManager")} />
            </li>
          );
        })}
      </ul>
      {totals ? (
        <>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold text-primary">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-sun" />
            {t("earnedCount", { count: earned, total: achievementCategories.length * achievementMilestones.length })}
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {achievementCategories.map((category) => (
              <div key={category} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
                <dt className="font-semibold text-muted">{t(`${category}.title`)}</dt>
                <dd className="mt-2 text-4xl font-semibold text-primary">{t("total", { count: totals[category] })}</dd>
              </div>
            ))}
          </dl>
          {achievementCategories.every((category) => totals[category] === 0) ? (
            <p className="mt-6 rounded-2xl bg-sun/40 p-4">{t("empty")}</p>
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-3xl border border-line bg-card p-5">
          <p className="text-muted">{t("guest")}</p>
          <Link href="/login?next=/achievements" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">{t("login")}</Link>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {achievementCategories.map((category) => (
          <section key={category} aria-labelledby={`achievement-${category}`}>
            <h2 id={`achievement-${category}`} className="text-3xl font-semibold">{t(`${category}.title`)}</h2>
            <p className="mt-2 max-w-3xl text-muted">{t(`${category}.description`)}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {achievementMilestones.map((target) => (
                <li key={target}>
                  <AchievementCard
                    title={t(`${category}.names.${target}`)}
                    requirement={t(`${category}.milestone`, { count: target })}
                    category={category}
                    count={totals ? totals[category] : null}
                    target={target}
                    progressLabel={totals ? t("progress", { count: Math.min(totals[category], target), target }) : t("preview")}
                    statusLabel={totals ? t(totals[category] >= target ? "earned" : "inProgress") : t("milestone")}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-card p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">{t("nextTitle")}</h2>
        <p className="mt-2 max-w-3xl text-muted">{t("nextBody")}</p>
        <Link href="/gardens" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">{t("findGarden")}</Link>
      </div>
    </section>
  );
}
