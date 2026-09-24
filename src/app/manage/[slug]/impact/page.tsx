import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImpactCharts } from "@/components/impact-charts";
import { readDb } from "@/lib/data/store";
import { impactSummary, periodRange, type PeriodKey } from "@/lib/impact";
import { gardenBySlug } from "@/lib/permissions";

export default async function ImpactPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("impact");
  const events = await getTranslations("events");
  const period = (["month", "season", "year", "custom"].includes(query.period ?? "") ? query.period : "season") as PeriodKey;
  const range = periodRange(period, garden.timezone, query.from, query.to);
  const summary = impactSummary(db, garden.garden_id, range.from, range.to);
  const empty = summary.visits === 0 && summary.eventsHeld === 0 && summary.harvestLb === 0;
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <form className="mt-4 flex flex-wrap gap-2">
        {(["month", "season", "year", "custom"] as const).map((key) => (
          <a key={key} href={`?period=${key}`} className={`rounded-full px-3 py-2 font-semibold ${period === key ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {t(key)}
          </a>
        ))}
      </form>
      {period === "custom" ? (
        <form className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="period" value="custom" />
          <label>
            {t("from")} <input type="date" name="from" defaultValue={query.from} className="rounded-xl border border-line px-2 py-1" />
          </label>
          <label>
            {t("to")} <input type="date" name="to" defaultValue={query.to} className="rounded-xl border border-line px-2 py-1" />
          </label>
          <button className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground" type="submit">
            {t("apply")}
          </button>
        </form>
      ) : null}
      {empty ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [t("visits"), summary.visits],
          [t("events"), summary.eventsHeld],
          [t("rsvps"), summary.rsvpCount],
          [t("members"), summary.activeMembers],
          [t("harvest"), summary.harvestLb],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl bg-card p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-3xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <ImpactCharts
        visits={summary.visitsByMonth}
        harvest={summary.harvestByMonth}
        categories={summary.eventsByCategory.map((row) => ({ category: events(row.category as "workday"), count: row.count }))}
        members={summary.membersByMonth}
        labels={{ visits: t("visitsChart"), harvest: t("harvestChart"), categories: t("categoryChart"), members: t("membersChart") }}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground" href={`/api/manage/${slug}/report?format=pdf&period=${period}&from=${query.from ?? ""}&to=${query.to ?? ""}`}>
          {t("pdf")}
        </a>
        <a className="rounded-full border border-line px-4 py-2 font-semibold" href={`/api/manage/${slug}/report?format=csv&period=${period}&from=${query.from ?? ""}&to=${query.to ?? ""}`}>
          {t("csv")}
        </a>
      </div>
    </section>
  );
}
