import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, userById } from "@/lib/permissions";
import { assignBed, createBed } from "@/server/garden-actions";

export default async function ManageBeds({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("beds");
  const beds = db.beds.filter((bed) => bed.garden_id === garden.garden_id);
  const members = db.memberships.filter((item) => item.garden_id === garden.garden_id && item.status === "approved");
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <form action={createBed.bind(null, slug)} className="mt-4 grid gap-2 sm:grid-cols-4">
        <input name="label" required placeholder={t("label")} className="rounded-xl border border-line px-3 py-2" />
        <input name="size" placeholder={t("size")} className="rounded-xl border border-line px-3 py-2" />
        <input name="notes" placeholder={t("notes")} className="rounded-xl border border-line px-3 py-2" />
        <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
          {t("create")}
        </button>
      </form>
      {beds.length === 0 ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {beds.map((bed) => (
          <li key={bed.bed_id} className="rounded-2xl border border-line bg-card p-4">
            <p className="text-xl font-semibold">{bed.label}</p>
            <p className="text-sm text-muted">
              {bed.size} · {t(bed.status)}
            </p>
            <form action={assignBed.bind(null, slug, bed.bed_id)} className="mt-3 flex gap-2">
              <select name="assigned_user_id" defaultValue={bed.assigned_user_id} className="w-full rounded-xl border border-line px-3 py-2">
                <option value="">{t("unassign")}</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {userById(db, member.user_id)?.name}
                  </option>
                ))}
              </select>
              <button className="rounded-full border border-line px-3 py-2 font-semibold" type="submit">
                {t("assign")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
