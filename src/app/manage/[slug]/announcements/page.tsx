import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BilingualFields } from "@/components/bilingual-fields";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { deleteAnnouncement, saveAnnouncement, updateAnnouncement } from "@/server/garden-actions";

export default async function AnnouncementsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("announcements");
  const events = await getTranslations("events");
  const rows = db.announcements.filter((item) => item.garden_id === garden.garden_id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <section className="grid gap-8 lg:grid-cols-2">
      <form
        action={async (formData) => {
          "use server";
          await saveAnnouncement(slug, formData);
        }} className="space-y-3">
        <h1 className="text-3xl font-semibold">{t("new")}</h1>
        {notice ? <p role="status">{t("save")}</p> : null}
        <BilingualFields />
        <label className="block">
          <select name="visibility" className="rounded-xl border border-line px-3 py-2">
            <option value="public">{events("public")}</option>
            <option value="members">{events("members")}</option>
          </select>
        </label>
        <label className="flex gap-2">
          <input type="checkbox" name="pinned" /> {t("pin")}
        </label>
        <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
          {t("save")}
        </button>
      </form>
      <ul className="space-y-3">
        {rows.length === 0 ? <li className="text-muted">{t("empty")}</li> : null}
        {rows.map((row) => (
          <li key={row.announcement_id} className="rounded-2xl border border-line bg-card p-4">
            <form
              action={async (formData) => {
                "use server";
                await updateAnnouncement(slug, formData);
              }}
              className="space-y-2"
            >
              <input type="hidden" name="announcement_id" value={row.announcement_id} />
              <BilingualFields titleEn={row.title_en} titleEs={row.title_es} bodyEn={row.body_en} bodyEs={row.body_es} />
              <select name="visibility" defaultValue={row.visibility} className="rounded-xl border border-line px-3 py-2">
                <option value="public">{events("public")}</option>
                <option value="members">{events("members")}</option>
              </select>
              <label className="flex gap-2">
                <input type="checkbox" name="pinned" defaultChecked={row.pinned} /> {t("pin")}
              </label>
              <button className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground" type="submit">
                {t("edit")}
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteAnnouncement(slug, row.announcement_id);
              }}
              className="mt-2"
            >
              <button className="text-sm font-semibold" type="submit">
                {t("delete")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
