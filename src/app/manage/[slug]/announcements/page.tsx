import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { saveAnnouncement } from "@/server/garden-actions";

export default async function AnnouncementsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("announcements");
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
        <input name="title_en" required placeholder="Title" className="w-full rounded-xl border border-line px-3 py-2" />
        <input name="title_es" placeholder="Título" className="w-full rounded-xl border border-line px-3 py-2" />
        <textarea name="body_en" required rows={4} placeholder="English" className="w-full rounded-xl border border-line px-3 py-2" />
        <textarea name="body_es" rows={4} placeholder="Español" className="w-full rounded-xl border border-line px-3 py-2" />
        <label className="block">
          <select name="visibility" className="rounded-xl border border-line px-3 py-2">
            <option value="public">Public</option>
            <option value="members">Members</option>
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
            <p className="font-semibold">{row.title_en}</p>
            <p className="text-sm text-muted">{row.visibility}{row.pinned ? " · pinned" : ""}</p>
            <p className="mt-2">{row.body_en}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
