import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { notFound } from "next/navigation";

export default async function ManageHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("manage");
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const pending = db.memberships.filter((item) => item.garden_id === garden.garden_id && item.status === "pending").length;
  return (
    <section>
      <h1 className="text-4xl font-semibold">{garden.name}</h1>
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
