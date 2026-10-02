import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { managerAwardIds } from "@/lib/awards";
import { readDb } from "@/lib/data/store";
import { countGardenVisits, totalHarvestPounds } from "@/lib/impact";
import { gardenBySlug } from "@/lib/permissions";
import { progressFor } from "@/lib/progression";
import { awardBadge } from "@/server/social-actions";

export default async function GardenersRoster({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("roster");
  const progress = await getTranslations("progress");
  const awards = await getTranslations("awards");
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();

  const ids = new Set<string>();
  for (const membership of db.memberships) {
    if (membership.garden_id === garden.garden_id && membership.status !== "rejected" && membership.status !== "removed") ids.add(membership.user_id);
  }
  for (const tie of db.gardenTies ?? []) if (tie.garden_id === garden.garden_id) ids.add(tie.user_id);
  for (const visit of db.visits) if (visit.garden_id === garden.garden_id && visit.source === "checkin") ids.add(visit.user_id);
  for (const offer of db.volunteerOffers ?? []) if (offer.garden_id === garden.garden_id) ids.add(offer.user_id);
  for (const entry of db.journalEntries) if (entry.garden_id === garden.garden_id) ids.add(entry.user_id);

  const harvestEntries = db.journalEntries.filter((entry) => entry.garden_id === garden.garden_id);
  const visitTotal = countGardenVisits(db.visits, garden.garden_id);
  const yieldTotal = totalHarvestPounds(harvestEntries);
  const rows = [...ids].flatMap((id) => {
    const person = db.users.find((user) => user.user_id === id);
    if (!person) return [];
    const stats = progressFor(db, id);
    const membership = db.memberships.find((item) => item.user_id === id && item.garden_id === garden.garden_id);
    const ties = (db.gardenTies ?? []).filter((tie) => tie.user_id === id && tie.garden_id === garden.garden_id);
    const given = (db.awardedBadges ?? []).filter((award) => award.user_id === id && award.garden_id === garden.garden_id);
    const visitsHere = countGardenVisits(db.visits, garden.garden_id, id);
    const poundsHere = totalHarvestPounds(harvestEntries.filter((entry) => entry.user_id === id));
    return [{ person, stats, membership, ties, given, visitsHere, poundsHere }];
  });

  return (
    <section>
      <h1 className="font-game text-4xl">{t("title")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{t("body")}</p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5">
          <dt className="text-sm font-semibold text-muted">{t("visitTotal")}</dt>
          <dd className="mt-1 text-4xl font-semibold text-primary">{visitTotal}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <dt className="text-sm font-semibold text-muted">{t("yieldTotal")}</dt>
          <dd className="mt-1 text-4xl font-semibold text-primary">{t("pounds", { pounds: yieldTotal })}</dd>
        </div>
      </dl>
      <p className="mt-4">
        <a href={`/manage/${slug}/events/new`} className="font-semibold text-primary underline">{t("publish")}</a>
      </p>
      {rows.length === 0 ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <ul className="mt-6 space-y-4">
        {rows.map(({ person, stats, membership, ties, given, visitsHere, poundsHere }) => (
          <li key={person.user_id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold">{person.name}</h2>
              <p className="font-semibold text-primary">{progress("level", { level: stats.level })} · {progress(`levels.${stats.levelId}`)}</p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {[
                ties.some((tie) => tie.kind === "favorite") ? t("favorite") : "",
                ties.some((tie) => tie.kind === "gardener") ? t("committed") : "",
                ties.some((tie) => tie.kind === "volunteer") ||
                (db.volunteerOffers ?? []).some((offer) => offer.user_id === person.user_id && offer.garden_id === garden.garden_id)
                  ? t("volunteer")
                  : "",
                membership?.status === "approved" ? t("approved") : membership?.status === "pending" ? t("pending") : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="mt-2 text-sm">
              {t("here", { visits: visitsHere, pounds: poundsHere })}
            </p>
            {given.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {given.map((award) => (
                  <li key={award.award_id} className="rounded-full bg-sun/50 px-3 py-1 text-sm font-semibold">
                    {awards(`${award.badge_id}.name`)}
                  </li>
                ))}
              </ul>
            ) : null}
            <form action={awardBadge} className="mt-4 flex flex-wrap items-end gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="user_id" value={person.user_id} />
              <label className="text-sm font-semibold">
                {t("award")}
                <select name="badge_id" className="mt-1 block rounded-xl border border-line bg-card px-3 py-2">
                  {managerAwardIds.map((id) => (
                    <option key={id} value={id}>{awards(`${id}.name`)}</option>
                  ))}
                </select>
              </label>
              <label className="min-w-48 flex-1 text-sm font-semibold">
                {t("note")}
                <input name="note" maxLength={160} className="mt-1 block w-full rounded-xl border border-line px-3 py-2" />
              </label>
              <button className="min-h-11 rounded-full bg-primary px-4 font-semibold text-primary-foreground" type="submit">{t("give")}</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
