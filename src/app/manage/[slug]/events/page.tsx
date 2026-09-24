import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { notFound } from "next/navigation";

export default async function ManageEvents({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations("events");
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const events = db.events.filter((event) => event.garden_id === garden.garden_id);
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <Link href={`/manage/${slug}/events/new`} className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
          {t("new")}
        </Link>
      </div>
      {events.length === 0 ? <p className="mt-6 text-muted">{t("empty")}</p> : null}
      <ul className="mt-6 space-y-3">
        {events.map((event) => (
          <li key={event.event_id} className="rounded-2xl border border-line bg-card p-4">
            <Link href={`/manage/${slug}/events/${event.event_id}`} className="text-xl font-semibold">
              {event.title_en}
            </Link>
            <p className="text-sm text-muted">
              {t(event.category)} · {t(event.visibility === "public" ? "public" : "members")} · {event.status}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
