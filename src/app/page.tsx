import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { nextPublicOccurrence } from "@/lib/events";
import { DateTime } from "luxon";

export default async function HomePage() {
  const t = await getTranslations("home");
  const db = await readDb();
  const featured = db.gardens.slice(0, 2);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-tight tracking-tight">{t("title")}</h1>
          <p className="mt-5 max-w-xl text-xl text-muted">{t("body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/gardens" className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground">
              {t("find")}
            </Link>
            <Link href="/signup?type=manager" className="rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground">
              {t("manage")}
            </Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-primary p-6 text-primary-foreground">
          <p className="text-sm font-semibold uppercase tracking-wide text-sun">{t("featured")}</p>
          <ul className="mt-4 space-y-3">
            {featured.map((garden) => {
              const next = nextPublicOccurrence(
                db.events.filter((event) => event.garden_id === garden.garden_id),
                db.eventExceptions,
                garden.timezone,
              );
              return (
                <li key={garden.garden_id}>
                  <Link href={`/gardens/${garden.slug}`} className="block rounded-2xl bg-white/10 p-4 hover:bg-white/15">
                    <span className="block text-2xl font-semibold">{garden.name}</span>
                    <span className="mt-1 block text-sm">
                      {garden.neighborhood}
                      {next ? ` · ${DateTime.fromISO(next.start).toFormat("ccc LLL d")}` : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        {[
          [t("card1Title"), t("card1Body")],
          [t("card2Title"), t("card2Body")],
          [t("card3Title"), t("card3Body")],
        ].map(([title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-card p-6">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-muted">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
