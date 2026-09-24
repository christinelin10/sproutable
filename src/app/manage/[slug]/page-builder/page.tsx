import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { addModule, deleteModule, moveModule, saveModule, toggleModule } from "@/server/garden-actions";
import { BilingualFields } from "@/components/bilingual-fields";
import type { HomeModule, ModuleType } from "@/lib/types";

const addable: ModuleType[] = ["about", "gallery", "upcoming_events", "ways", "tools", "getting_here", "announcements", "contact"];

export default async function PageBuilder({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ notice?: string }> }) {
  const { slug } = await params;
  const { notice } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("builder");
  const modules = db.homeModules.filter((item) => item.garden_id === garden.garden_id).sort((a, b) => a.position - b.position);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <a href={`/gardens/${slug}`} className="rounded-full border border-line px-4 py-2 font-semibold">
          {t("view")}
        </a>
      </div>
      {notice ? <p role="status" className="mt-4 rounded-2xl bg-sun/40 px-4 py-3">{t("save")}</p> : null}
      <form className="mt-4 flex flex-wrap gap-2" action={async (formData) => {
        "use server";
        await addModule(slug, String(formData.get("type")) as ModuleType);
      }}>
        <label className="font-semibold">
          {t("add")}
          <select name="type" className="ml-2 rounded-xl border border-line px-3 py-2">
            {addable.map((type) => (
              <option key={type} value={type}>
                {t(type)}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
          {t("add")}
        </button>
      </form>
      <div className="mt-6 space-y-4">
        {modules.map((module) => (
          <details key={module.module_id} className="rounded-3xl border border-line bg-card p-4" open>
            <summary className="cursor-pointer text-xl font-semibold">
              {t(module.type)} {!module.visible ? `(${t("hide")})` : ""}
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={moveModule.bind(null, slug, module.module_id, "up")}>
                <button className="rounded-full border border-line px-3 py-1" type="submit">{t("up")}</button>
              </form>
              <form action={moveModule.bind(null, slug, module.module_id, "down")}>
                <button className="rounded-full border border-line px-3 py-1" type="submit">{t("down")}</button>
              </form>
              <form action={toggleModule.bind(null, slug, module.module_id)}>
                <button className="rounded-full border border-line px-3 py-1" type="submit">{module.visible ? t("hide") : t("show")}</button>
              </form>
              {module.type !== "hero" ? (
                <form action={deleteModule.bind(null, slug, module.module_id)}>
                  <button className="rounded-full border border-line px-3 py-1" type="submit">{t("delete")}</button>
                </form>
              ) : null}
            </div>
            <ModuleForm slug={slug} module={module} />
          </details>
        ))}
      </div>
    </section>
  );
}

function ModuleForm({ slug, module }: { slug: string; module: HomeModule }) {
  const images = Array.isArray(module.config.images) ? (module.config.images as { url: string; caption_en?: string }[]) : [];
  const tools = Array.isArray(module.config.items) ? (module.config.items as Record<string, string>[]) : [];
  return (
    <form
      action={async (formData) => {
        "use server";
        await saveModule(slug, formData);
      }} className="mt-4 space-y-3">
      <input type="hidden" name="module_id" value={module.module_id} />
      <BilingualFields titleEn={module.title_en} titleEs={module.title_es} bodyEn={module.body_en} bodyEs={module.body_es} />
      {module.type === "hero" ? (
        <label className="block text-sm font-semibold">
          Cover
          <input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block" />
        </label>
      ) : null}
      {module.type === "gallery" ? (
        <div>
          <ul className="space-y-2">
            {images.map((image) => (
              <li key={image.url} className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <label className="text-sm">
                  <input type="checkbox" name="remove" value={image.url} /> remove
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-2 block text-sm">Alt English <input name="alt_en" className="mt-1 w-full rounded-xl border border-line px-3 py-2" /></label>
          <label className="mt-2 block text-sm">Alt Spanish <input name="alt_es" className="mt-1 w-full rounded-xl border border-line px-3 py-2" /></label>
          <label className="mt-2 block text-sm">Caption English <input name="caption_en" className="mt-1 w-full rounded-xl border border-line px-3 py-2" /></label>
          <label className="mt-2 block text-sm">Caption Spanish <input name="caption_es" className="mt-1 w-full rounded-xl border border-line px-3 py-2" /></label>
          <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block" />
        </div>
      ) : null}
      {module.type === "tools"
        ? Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <input name={`tool_name_en_${index}`} defaultValue={tools[index]?.name_en ?? ""} placeholder="Tool" className="rounded-xl border border-line px-3 py-2" />
              <input name={`tool_name_es_${index}`} defaultValue={tools[index]?.name_es ?? ""} placeholder="Herramienta" className="rounded-xl border border-line px-3 py-2" />
              <input name={`tool_note_en_${index}`} defaultValue={tools[index]?.note_en ?? ""} placeholder="Note" className="rounded-xl border border-line px-3 py-2" />
              <input name={`tool_note_es_${index}`} defaultValue={tools[index]?.note_es ?? ""} placeholder="Nota" className="rounded-xl border border-line px-3 py-2" />
            </div>
          ))
        : null}
      {module.type === "getting_here" ? (
        <div className="grid gap-2">
          {(["bus_en", "bus_es", "parking_en", "parking_es", "access_en", "access_es"] as const).map((key) => (
            <label key={key} className="text-sm font-semibold">
              {key}
              <input name={key} defaultValue={String(module.config[key] ?? "")} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
            </label>
          ))}
        </div>
      ) : null}
      {module.type === "ways" ? (
        <fieldset className="flex flex-wrap gap-3">
          {["bed", "volunteer", "events", "produce", "learn"].map((option) => (
            <label key={option}>
              <input type="checkbox" name={`inv_${option}`} defaultChecked={Array.isArray(module.config.options) && (module.config.options as string[]).includes(option)} /> {option}
            </label>
          ))}
        </fieldset>
      ) : null}
      {module.type === "contact" ? (
        <div className="grid gap-2">
          <input name="instagram" defaultValue={String(module.config.instagram ?? "")} placeholder="Instagram" className="rounded-xl border border-line px-3 py-2" />
          <input name="facebook" defaultValue={String(module.config.facebook ?? "")} placeholder="Facebook" className="rounded-xl border border-line px-3 py-2" />
        </div>
      ) : null}
      <Save />
    </form>
  );
}

async function Save() {
  const t = await getTranslations("builder");
  return (
    <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
      {t("save")}
    </button>
  );
}
