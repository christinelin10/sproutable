import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AchievementCard } from "@/components/achievement-card";
import { achievementCategories, achievementMilestones, participationTotals } from "@/lib/achievements";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";

export default async function AchievementsPage() {
  const t = await getTranslations("achievements");
  const user = await getCurrentUser();
  const totals = user ? participationTotals(await readDb(), user.user_id) : null;
  const earned = totals ? achievementCategories.reduce(
    (sum, category) => sum + achievementMilestones.filter((target) => totals[category] >= target).length,
    0,
  ) : 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <Link href="/" className="font-semibold text-primary underline">{t("home")}</Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-xl text-muted">{t("body")}</p>
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
