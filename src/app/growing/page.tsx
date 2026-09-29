import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/button";
import { Field, TextArea, TextInput } from "@/components/field";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { BEECHVIEW_SLUG, formatDollars, SEASON_FUND_GOAL_CENTS } from "@/lib/growing";
import { managesGarden } from "@/lib/permissions";
import { claimNeed, markReceived, offerItem, pledgeMoney, postNeed } from "@/server/growing-actions";
import type { Bed, JournalEntry, JournalStage, Language } from "@/lib/types";

const stages = ["planted", "growing", "maintenance", "harvest"] as const;

export default async function GrowingPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; notice?: string; error?: string }>;
}) {
  const { stage: stageQuery = "", notice = "", error = "" } = await searchParams;
  const stage = stages.includes(stageQuery as JournalStage) ? (stageQuery as JournalStage) : "";
  const t = await getTranslations("growing");
  const bedsT = await getTranslations("beds");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const user = await getCurrentUser();
  const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG) ?? null;

  if (!garden) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-semibold">{t("title")}</h1>
        <p className="mt-4 text-muted">{t("missing")}</p>
      </section>
    );
  }

  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const managerIds = new Set(
    db.gardenManagers.filter((row) => row.garden_id === garden.garden_id).map((row) => row.user_id),
  );
  const beds = db.beds.filter((bed) => bed.garden_id === garden.garden_id);
  const entries = db.journalEntries
    .filter((entry) => entry.garden_id === garden.garden_id)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at));
  const latestByBed = new Map<string, JournalEntry>();
  for (const entry of [...entries].reverse()) latestByBed.set(entry.bed_id, entry);
  const shown = beds.filter((bed) => {
    if (!stage) return true;
    return latestByBed.get(bed.bed_id)?.stage === stage;
  });
  const items = (db.itemDonations ?? [])
    .filter((item) => item.garden_id === garden.garden_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pledges = (db.moneyDonations ?? [])
    .filter((item) => item.garden_id === garden.garden_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pledged = pledges.reduce((sum, item) => sum + item.amount_cents, 0);
  const percent = Math.min(100, Math.round((pledged / SEASON_FUND_GOAL_CENTS) * 100));
  const harvestLb = Math.round(entries.reduce((sum, entry) => sum + (entry.harvest_unit === "lb" ? entry.harvest_amount ?? 0 : 0), 0) * 10) / 10;

  function person(bed: Bed) {
    if (!bed.assigned_user_id) return t("open");
    if (managerIds.has(bed.assigned_user_id)) return t("shared");
    const holder = db.users.find((item) => item.user_id === bed.assigned_user_id);
    return t("leased", { name: holder?.name.split(" ")[0] ?? "" });
  }

  function when(entry: JournalEntry) {
    const parsed = DateTime.fromISO(entry.entry_date);
    if (!parsed.isValid) return entry.entry_date;
    return parsed.setLocale(locale).toFormat("ccc LLL d");
  }

  const noticeText =
    notice === "pledged"
      ? t("noticePledged")
      : notice === "offered"
        ? t("noticeOffered")
        : notice === "claimed"
          ? t("noticeClaimed")
          : notice === "needed"
            ? t("noticeNeeded")
            : notice === "received"
              ? t("noticeReceived")
              : "";
  const errorText =
    error === "amount" ? t("errorAmount") : error === "item" ? t("errorItem") : error === "denied" ? t("errorDenied") : error === "taken" ? t("errorTaken") : "";

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <p className="font-semibold text-primary">{t("place")}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-6xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-xl text-muted">
        {garden.address}. {t("hours")}.
      </p>
      {noticeText ? (
        <p role="status" className="mt-6 rounded-2xl bg-sun/50 px-4 py-3 font-semibold">
          {noticeText}
        </p>
      ) : null}
      {errorText ? (
        <p role="alert" className="mt-6 rounded-2xl bg-[#f3d6d2] px-4 py-3 font-semibold">
          {errorText}
        </p>
      ) : null}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.8fr)]">
        <div id="ground" className="rounded-3xl border border-line bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-semibold">{t("boxTitle")}</h2>
              <p className="mt-1 text-muted">
                {t("bedCount", { count: beds.length })}
                {harvestLb ? ` · ${harvestLb} lb` : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("filter")}>
            <Filter href="/growing#ground" current={!stage}>
              {t("all")}
            </Filter>
            {stages.map((item) => (
              <Filter key={item} href={`/growing?stage=${item}#ground`} current={stage === item}>
                {bedsT(item)}
              </Filter>
            ))}
          </div>
          {shown.length === 0 ? <p className="mt-6 text-muted">{t("emptyBeds")}</p> : null}
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {shown.map((bed) => {
              const latest = latestByBed.get(bed.bed_id);
              const photo = latest?.image_urls[0];
              return (
                <li key={bed.bed_id} className="overflow-hidden rounded-2xl border border-line bg-background">
                  {photo ? (
                    <Image src={photo} alt={latest?.crop ? t("photo", { crop: latest.crop }) : bed.label} width={640} height={360} className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-16 items-end bg-primary/10 px-4 pb-2 text-sm font-semibold text-primary">{bed.size}</div>
                  )}
                  <div className="p-4">
                    <p className="text-sm font-semibold text-primary">{bed.label}</p>
                    <p className="mt-1 text-xl font-semibold">{latest?.crop || t("noCrop")}</p>
                    <p className="mt-1 text-sm text-muted">
                      {person(bed)}
                      {latest ? ` · ${bedsT(latest.stage)}` : ""}
                      {bed.size ? ` · ${bed.size}` : ""}
                    </p>
                    {latest ? <p className="mt-3">{latest.text}</p> : <p className="mt-3 text-muted">{bed.notes}</p>}
                  </div>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-8 text-2xl font-semibold">{t("journalTitle")}</h3>
          {entries.length === 0 ? <p className="mt-3 text-muted">{t("emptyJournal")}</p> : null}
          <ol className="mt-4 space-y-3">
            {entries.slice(0, 6).map((entry) => {
              const bed = beds.find((item) => item.bed_id === entry.bed_id);
              return (
                <li key={entry.entry_id} className="rounded-2xl border border-line p-4">
                  <p className="font-semibold">
                    {when(entry)} · {bed?.label ?? entry.crop}
                    {entry.crop ? ` · ${entry.crop}` : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary">{bedsT(entry.stage)}</p>
                  <p className="mt-2">{entry.text}</p>
                  {entry.harvest_amount ? (
                    <p className="mt-1 text-sm">
                      {entry.harvest_amount} {entry.harvest_unit}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <aside id="donations" className="space-y-4">
          <h2 className="text-3xl font-semibold">{t("donations")}</h2>
          <article className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-muted">{t("moneyMark")}</p>
            <h3 className="mt-1 text-2xl font-semibold">{t("money")}</h3>
            <p className="mt-3 text-4xl font-semibold">{formatDollars(pledged, locale)}</p>
            <p className="text-muted">{t("ofGoal", { goal: formatDollars(SEASON_FUND_GOAL_CENTS, locale) })}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuenow={pledged} aria-valuemin={0} aria-valuemax={SEASON_FUND_GOAL_CENTS} aria-label={t("goalLabel")}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-sm text-muted">{t("goalHint")}</p>
            <h4 className="mt-5 font-semibold">{t("recent")}</h4>
            {pledges.length === 0 ? <p className="mt-2 text-muted">{t("noPledges")}</p> : null}
            <ul className="mt-2 space-y-2">
              {pledges.slice(0, 6).map((pledge) => (
                <li key={pledge.donation_id}>
                  <span className="font-semibold">{pledge.name.split(" ")[0]}</span>
                  <span className="text-muted"> · {formatDollars(pledge.amount_cents, locale)}</span>
                  {pledge.note ? <span className="mt-0.5 block text-sm text-muted">{pledge.note}</span> : null}
                </li>
              ))}
            </ul>
            {user ? (
              <form action={pledgeMoney} className="mt-5 space-y-3">
                <Field label={t("dollars")}>
                  <TextInput name="dollars" type="number" inputMode="numeric" min={1} max={500} step={1} required />
                </Field>
                <Field label={t("note")}>
                  <TextInput name="note" maxLength={200} />
                </Field>
                <Button type="submit">{t("pledge")}</Button>
              </form>
            ) : null}
          </article>

          <article className="rounded-3xl border border-line bg-card p-5 shadow-sm">
            <p className="text-sm font-semibold tracking-wide text-muted">{t("itemsMark")}</p>
            <h3 className="mt-1 text-2xl font-semibold">{t("items")}</h3>
            {items.length === 0 ? <p className="mt-3 text-muted">{t("emptyItems")}</p> : null}
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.donation_id} className="rounded-2xl border border-line p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-sm font-semibold ${item.status === "needed" ? "bg-sun/70" : item.status === "offered" ? "bg-primary/15 text-primary" : "bg-background text-muted"}`}>
                      {t(item.status)}
                    </span>
                  </div>
                  {item.detail ? <p className="mt-1 text-sm text-muted">{item.detail}</p> : null}
                  {item.offered_name ? <p className="mt-1 text-sm">{item.offered_name}</p> : null}
                  {user && item.status === "needed" ? (
                    <form action={claimNeed} className="mt-2">
                      <input type="hidden" name="donation_id" value={item.donation_id} />
                      <Button type="submit" variant="ghost">
                        {t("bring")}
                      </Button>
                    </form>
                  ) : null}
                  {manager && item.status !== "received" ? (
                    <form action={markReceived} className="mt-2">
                      <input type="hidden" name="donation_id" value={item.donation_id} />
                      <Button type="submit" variant="ghost">
                        {t("markReceived")}
                      </Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
            {user ? (
              <form action={offerItem} className="mt-5 space-y-3">
                <h4 className="font-semibold">{t("offerNew")}</h4>
                <Field label={t("itemName")}>
                  <TextInput name="title" required maxLength={80} />
                </Field>
                <Field label={t("detail")}>
                  <TextArea name="detail" rows={2} maxLength={240} />
                </Field>
                <Button type="submit" variant="accent">
                  {t("offerSubmit")}
                </Button>
              </form>
            ) : (
              <p className="mt-5">
                <Link href="/login?next=/growing" className="font-semibold text-primary underline">
                  {t("login")}
                </Link>
              </p>
            )}
            {manager ? (
              <form action={postNeed} className="mt-5 space-y-3 border-t border-line pt-5">
                <h4 className="font-semibold">{t("postNeed")}</h4>
                <Field label={t("itemName")}>
                  <TextInput name="title" required maxLength={80} />
                </Field>
                <Field label={t("detail")}>
                  <TextArea name="detail" rows={2} maxLength={240} />
                </Field>
                <Button type="submit" variant="ghost">
                  {t("postNeed")}
                </Button>
              </form>
            ) : null}
          </article>
        </aside>
      </div>
    </section>
  );
}

function Filter({ href, current, children }: { href: string; current: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={current ? "true" : undefined} className={`inline-flex min-h-10 items-center rounded-full px-3 font-semibold ${current ? "bg-primary text-primary-foreground" : "border border-line bg-background"}`}>
      {children}
    </Link>
  );
}
