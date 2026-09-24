import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { PLATFORM_ADMINS } from "@/lib/demo";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { ManagerPanel } from "@/components/manager-panel";
import { gardenBySlug, userById } from "@/lib/permissions";
import { saveGardenSettings } from "@/server/garden-actions";

export default async function SettingsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  const user = await getCurrentUser();
  if (!garden) notFound();
  const t = await getTranslations("settings");
  const admin = user ? PLATFORM_ADMINS.has(user.email) : false;
  return (
    <section>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-2 font-semibold">{garden.verified ? t("verified") : t("notVerified")}</p>
      {notice ? <p role="status" className="mt-3 rounded-2xl bg-sun/40 px-4 py-3">{t("save")}</p> : null}
      <form
        action={async (formData) => {
          "use server";
          await saveGardenSettings(slug, formData);
        }} className="mt-4 grid max-w-xl gap-3">
        <input name="name" defaultValue={garden.name} className="rounded-xl border border-line px-3 py-2" />
        <input name="address" defaultValue={garden.address} className="rounded-xl border border-line px-3 py-2" />
        <input name="neighborhood" defaultValue={garden.neighborhood} className="rounded-xl border border-line px-3 py-2" />
        <textarea name="description_en" defaultValue={garden.description_en} rows={3} className="rounded-xl border border-line px-3 py-2" />
        <textarea name="description_es" defaultValue={garden.description_es} rows={3} className="rounded-xl border border-line px-3 py-2" />
        <input name="contact_email" defaultValue={garden.contact_email} className="rounded-xl border border-line px-3 py-2" />
        <input name="contact_phone" defaultValue={garden.contact_phone} className="rounded-xl border border-line px-3 py-2" />
        <input name="year_founded" defaultValue={garden.year_founded} className="rounded-xl border border-line px-3 py-2" />
        <input name="bed_count" defaultValue={garden.bed_count} className="rounded-xl border border-line px-3 py-2" />
        {admin ? (
          <label className="flex gap-2 font-semibold">
            <input type="checkbox" name="verified" defaultChecked={garden.verified} /> {t("toggle")}
          </label>
        ) : null}
        <button className="w-fit rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
          {t("save")}
        </button>
      </form>
      <ManagerPanel
        slug={slug}
        managers={db.gardenManagers
          .filter((row) => row.garden_id === garden.garden_id)
          .map((row) => {
            const person = userById(db, row.user_id);
            return { user_id: row.user_id, name: person?.name ?? row.user_id, email: person?.email ?? "" };
          })}
      />
    </section>
  );
}
