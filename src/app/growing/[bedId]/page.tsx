import Link from "next/link";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { PlantSprite } from "@/components/game/plant-sprite";
import { cropPhoto } from "@/lib/crop-photos";
import { readDb } from "@/lib/data/store";
import { BEECHVIEW_SLUG } from "@/lib/growing";
import type { JournalEntry, Language } from "@/lib/types";

export default async function PlantPage({ params }: { params: Promise<{ bedId: string }> }) {
  const { bedId } = await params;
  const t = await getTranslations("plant");
  const bedsT = await getTranslations("beds");
  const growing = await getTranslations("growing");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG);
  const bed = garden ? db.beds.find((item) => item.bed_id === bedId && item.garden_id === garden.garden_id) : undefined;
  if (!garden || !bed) notFound();

  const entries = db.journalEntries
    .filter((entry) => entry.bed_id === bed.bed_id)
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at));
  const latest = entries[0];
  const holder = bed.assigned_user_id ? db.users.find((user) => user.user_id === bed.assigned_user_id) : undefined;
  const photo = cropPhoto(latest?.crop ?? "");

  function when(entry: JournalEntry) {
    const parsed = DateTime.fromISO(entry.entry_date);
    return parsed.isValid ? parsed.setLocale(locale).toFormat("ccc LLL d") : entry.entry_date;
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/growing" className="font-semibold text-primary underline">
        {t("back")}
      </Link>
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border-4 border-[#3d2914] bg-card shadow-[6px_6px_0_#3d2914]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={latest?.crop ? growing("photo", { crop: latest.crop }) : bed.label} className="h-56 w-full object-cover sm:h-72" />
        <div className="flex flex-wrap items-end gap-4 p-5">
          <PlantSprite stage={latest?.stage ?? ""} className="plant-sway h-20 w-20" />
          <div>
            <p className="font-semibold text-primary">{garden.name}</p>
            <h1 className="font-game text-4xl leading-none sm:text-5xl">{latest?.crop || growing("noCrop")}</h1>
            <p className="mt-2 text-muted">
              {bed.label}
              {latest ? ` · ${bedsT(latest.stage)}` : ""}
              {holder ? ` · ${holder.name.split(" ")[0]}` : ` · ${growing("open")}`}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-lg">{latest?.text || bed.notes || t("quiet")}</p>

      <h2 className="mt-8 font-game text-3xl">{t("journal")}</h2>
      {entries.length === 0 ? <p className="mt-3 text-muted">{t("empty")}</p> : null}
      <ol className="mt-4 space-y-3">
        {entries.map((entry) => (
          <li key={entry.entry_id} className="rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold">
              {when(entry)} · {bedsT(entry.stage)}
              {entry.crop ? ` · ${entry.crop}` : ""}
            </p>
            <p className="mt-2">{entry.text}</p>
            {entry.harvest_amount ? (
              <p className="mt-2 text-sm font-semibold">
                {t("harvest", { amount: entry.harvest_amount, unit: entry.harvest_unit })}
              </p>
            ) : null}
          </li>
        ))}
      </ol>

      <h2 className="mt-8 font-game text-3xl">{t("participate")}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        <li>
          <Link href={`/gardens/${garden.slug}`} className="game-btn inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
            {t("visit")}
          </Link>
        </li>
        <li>
          <Link href={`/events?garden=${garden.slug}`} className="game-btn inline-flex min-h-11 items-center bg-[#fffdf8] px-4 font-semibold">
            {t("events")}
          </Link>
        </li>
        <li>
          <Link href="/growing#donations" className="game-btn inline-flex min-h-11 items-center bg-[#fffdf8] px-4 font-semibold">
            {t("help")}
          </Link>
        </li>
      </ul>
    </article>
  );
}
