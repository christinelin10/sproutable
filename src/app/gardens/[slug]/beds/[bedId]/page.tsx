import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";
import { JournalForm, PhotoButton } from "@/components/journal-form";
import { deleteJournal } from "@/server/garden-actions";

export default async function BedJournalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; bedId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { slug, bedId } = await params;
  const { notice } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  const bed = db.beds.find((item) => item.bed_id === bedId && item.garden_id === garden?.garden_id);
  if (!garden || !bed) notFound();
  const user = await getCurrentUser();
  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const holder = user?.user_id === bed.assigned_user_id;
  if (!manager && !holder) notFound();
  const t = await getTranslations("beds");
  const entries = db.journalEntries.filter((entry) => entry.bed_id === bed.bed_id).sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-semibold">
        {bed.label} · {t("journal")}
      </h1>
      {!holder ? <p className="mt-2 text-muted">{t("readOnly")}</p> : null}
      {notice ? <p role="status" className="mt-3 rounded-2xl bg-sun/40 px-4 py-3">{t("save")}</p> : null}
      {holder ? <JournalForm slug={slug} bedId={bed.bed_id} today={today} /> : null}
      {entries.length === 0 ? <p className="mt-6 text-muted">{t("timelineEmpty")}</p> : null}
      <ol className="mt-6 space-y-4">
        {entries.map((entry) => (
          <li key={entry.entry_id} className="rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold">
              {entry.entry_date} · {t(entry.stage)}
              {entry.crop ? ` · ${entry.crop}` : ""}
            </p>
            <p className="mt-2">{entry.text}</p>
            {entry.harvest_amount ? (
              <p className="mt-1 text-sm">
                {entry.harvest_amount} {entry.harvest_unit}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.image_urls.map((url) => (
                <PhotoButton key={url} url={url} />
              ))}
            </div>
            {holder && entry.user_id === user?.user_id ? (
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold">{t("edit")}</summary>
                <JournalForm slug={slug} bedId={bed.bed_id} today={today} entry={entry} />
                <form action={deleteJournal.bind(null, slug, entry.entry_id)}>
                  <button className="text-sm font-semibold" type="submit">
                    {t("delete")}
                  </button>
                </form>
              </details>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
