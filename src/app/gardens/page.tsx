import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { nextPublicOccurrence } from "@/lib/events";
import { formatDate } from "@/lib/format";
import type { Language } from "@/lib/types";

export default async function GardensPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; welcome?: string }>;
}) {
  const { q = "", welcome } = await searchParams;
  const t = await getTranslations("gardens");
  const locale = (await getLocale()) as Language;
  const db = await readDb();
  const query = q.trim().toLowerCase();
  const gardens = db.gardens.filter(
    (garden) => !query || garden.name.toLowerCase().includes(query) || garden.neighborhood.toLowerCase().includes(query),
  );

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {welcome ? <p className="mb-6 rounded-2xl bg-sun/40 px-4 py-3 font-semibold">{t("welcome")}</p> : null}
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      <form className="mt-6" action="/gardens">
        <label className="block font-semibold" htmlFor="q">
          {t("search")}
        </label>
        <input id="q" name="q" defaultValue={q} className="mt-2 w-full max-w-md rounded-xl border border-line bg-white px-3 py-2" />
      </form>
      {gardens.length === 0 ? <p className="mt-10 text-muted">{t("empty")}</p> : null}
      <ul className="mt-8 grid gap-5 md:grid-cols-2">
        {gardens.map((garden) => {
          const next = nextPublicOccurrence(
            db.events.filter((event) => event.garden_id === garden.garden_id),
            db.eventExceptions,
            garden.timezone,
          );
          return (
            <li key={garden.garden_id}>
              <Link href={`/gardens/${garden.slug}`} className="block overflow-hidden rounded-3xl border border-line bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={garden.cover_image_url} alt="" className="h-48 w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold">{garden.name}</h2>
                    {garden.verified ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">{t("verified")}</span> : null}
                  </div>
                  <p className="mt-1 text-muted">{garden.neighborhood}</p>
                  <p className="mt-3">
                    {locale === "es" && garden.description_es ? garden.description_es : garden.description_en}
                  </p>
                  <p className="mt-3 text-sm font-semibold">
                    {t("next")}: {next ? formatDate(next.date, locale, garden.timezone) : t("none")}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
