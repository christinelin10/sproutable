import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { countGardenVisits, totalHarvestPounds } from "@/lib/impact";
import { gardenBySlug } from "@/lib/permissions";
import { notFound } from "next/navigation";

export default async function ManageHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("manage");
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const pending = db.memberships.filter((item) => item.garden_id === garden.garden_id && item.status === "pending").length;
  const visits = countGardenVisits(db.visits, garden.garden_id);
  const pounds = totalHarvestPounds(db.journalEntries.filter((entry) => entry.garden_id === garden.garden_id));
  return (
    <section>
      <h1 className="text-4xl font-semibold">{garden.name}</h1>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5">
          <dt className="text-sm font-semibold text-muted">{t("visitTotal")}</dt>
          <dd className="mt-1 text-4xl font-semibold text-primary">{visits}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <dt className="text-sm font-semibold text-muted">{t("yieldTotal")}</dt>
          <dd className="mt-1 text-4xl font-semibold text-primary">{t("pounds", { pounds })}</dd>
        </div>
      </dl>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link href={`/manage/${slug}/events/new`} className="rounded-3xl bg-accent p-5 font-semibold text-accent-foreground">
          {t("newEvent")}
        </Link>
        <Link href={`/manage/${slug}/announcements`} className="rounded-3xl bg-primary p-5 font-semibold text-primary-foreground">
          {t("post")}
        </Link>
        <Link href={`/manage/${slug}/members`} className="rounded-3xl border border-line bg-card p-5 font-semibold">
          {t("review")} {pending ? `(${pending})` : ""}
        </Link>
      </div>
    </section>
  );
}
