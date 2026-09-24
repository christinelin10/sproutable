import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";

export default async function BedsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/gardens/${slug}/beds`);
  const manager = managesGarden(db, user.user_id, garden.garden_id);
  const mine = db.beds.filter((bed) => bed.garden_id === garden.garden_id && bed.assigned_user_id === user.user_id);
  const beds = manager ? db.beds.filter((bed) => bed.garden_id === garden.garden_id) : mine;
  const t = await getTranslations("beds");
  if (!manager && mine.length === 0) return <p className="mx-auto max-w-xl px-4 py-10 text-muted">{t("none")}</p>;
  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-semibold">{manager ? t("title") : t("my")}</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {beds.map((bed) => (
          <li key={bed.bed_id} className="rounded-2xl border border-line bg-card p-4">
            <Link href={`/gardens/${slug}/beds/${bed.bed_id}`} className="text-xl font-semibold">
              {bed.label}
            </Link>
            <p className="text-sm text-muted">
              {bed.size} · {t(bed.status)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
