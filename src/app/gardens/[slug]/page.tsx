import Link from "next/link";
import { GardenCover } from "@/components/garden-cover";
import { getLocale, getTranslations } from "next-intl/server";
import { Markdown } from "@/components/markdown";
import { JoinGarden } from "@/components/join-garden";
import { CheckInButton } from "@/components/check-in";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { expandEvents } from "@/lib/events";
import { formatDateTime } from "@/lib/format";
import { canSeeMembersContent, gardenBySlug, managesGarden, membershipFor } from "@/lib/permissions";
import { pickLocalized } from "@/lib/text";
import type { Announcement, Garden, HomeModule, Language } from "@/lib/types";
import { DateTime } from "luxon";
import { notFound } from "next/navigation";

export default async function GardenHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const user = await getCurrentUser();
  const locale = (await getLocale()) as Language;
  const t = await getTranslations("garden");
  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const membership = user ? membershipFor(db, user.user_id, garden.garden_id) : null;
  const modules = db.homeModules
    .filter((item) => item.garden_id === garden.garden_id && item.visible)
    .sort((a, b) => a.position - b.position);
  const upcoming = expandEvents(
    db.events.filter((event) => event.garden_id === garden.garden_id && event.visibility === "public"),
    db.eventExceptions,
    garden.timezone,
    DateTime.now().setZone(garden.timezone),
    DateTime.now().setZone(garden.timezone).plus({ months: 2 }),
  )
    .filter((item) => !item.cancelled)
    .slice(0, 3);
  const announcements = db.announcements
    .filter((item) => item.garden_id === garden.garden_id)
    .filter((item) => item.visibility === "public" || (user && canSeeMembersContent(db, user.user_id, garden.garden_id)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.created_at.localeCompare(a.created_at))
    .slice(0, 3);
  const day = DateTime.now().setZone(garden.timezone).toISODate();
  const checkedIn = Boolean(
    user &&
      db.visits.some(
        (visit) =>
          visit.user_id === user.user_id &&
          visit.garden_id === garden.garden_id &&
          visit.source === "checkin" &&
          DateTime.fromISO(visit.visited_at).setZone(garden.timezone).toISODate() === day,
      ),
  );

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      {manager ? (
        <Link href={`/manage/${slug}/page-builder`} className="mb-4 inline-flex rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">
          {t("edit")}
        </Link>
      ) : null}
      {modules.map((module) => (
        <section key={module.module_id} className="mb-8">
          <ModuleBlock
            module={module}
            garden={garden}
            locale={locale}
            upcoming={upcoming.map((item) => ({
              id: `${item.eventId}-${item.date}`,
              title: pickLocalized(locale, item.event.title_en, item.event.title_es).text,
              when: formatDateTime(item.start, locale, garden.timezone),
            }))}
            announcements={announcements}
            join={
              <JoinGarden
                gardenId={garden.garden_id}
                loggedIn={Boolean(user)}
                status={membership?.status ?? ""}
                loginHref={`/login?next=/gardens/${slug}`}
              />
            }
            credit={t("aerial")}
          />
        </section>
      ))}
      {user && canSeeMembersContent(db, user.user_id, garden.garden_id) ? (
        <CheckInButton slug={slug} checkedIn={checkedIn} label={t("checkin")} done={t("checkedIn")} />
      ) : null}
    </article>
  );
}

function ModuleBlock({
  module,
  garden,
  locale,
  upcoming,
  announcements,
  join,
  credit,
}: {
  module: HomeModule;
  garden: Garden;
  locale: Language;
  upcoming: { id: string; title: string; when: string }[];
  announcements: Announcement[];
  join: React.ReactNode;
  credit: string;
}) {
  const title = pickLocalized(locale, module.title_en, module.title_es);
  const body = pickLocalized(locale, module.body_en, module.body_es);
  if (module.type === "hero") {
    return (
      <div className="overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
        <GardenCover slug={garden.slug} fallback={garden.cover_image_url} alt="" className="h-80 w-full object-cover" credit={credit} />
        <div className="p-6">
          <h1 className="text-4xl font-semibold">{garden.name}</h1>
          {title.text ? <p className="mt-2 text-lg">{title.text}</p> : null}
          <div className="mt-4">{join}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-line bg-card p-6">
      {title.text ? <h2 className="text-2xl font-semibold">{title.text}</h2> : null}
      {title.fallback || body.fallback ? <Fallback /> : null}
      {body.text ? (
        <div className="mt-3">
          <Markdown text={body.text} />
        </div>
      ) : null}
      {module.type === "gallery" ? <Gallery config={module.config} locale={locale} /> : null}
      {module.type === "upcoming_events" ? <Upcoming items={upcoming} slug={garden.slug} /> : null}
      {module.type === "ways" ? <Ways config={module.config} locale={locale} /> : null}
      {module.type === "tools" ? <Tools config={module.config} locale={locale} /> : null}
      {module.type === "getting_here" ? <GettingHere garden={garden} config={module.config} locale={locale} /> : null}
      {module.type === "announcements" ? <News items={announcements} locale={locale} /> : null}
      {module.type === "contact" ? <Contact garden={garden} config={module.config} /> : null}
    </div>
  );
}

async function Fallback() {
  const t = await getTranslations("garden");
  return <p className="mt-1 text-sm text-muted">{t("fallback")}</p>;
}

function Gallery({ config, locale }: { config: Record<string, unknown>; locale: Language }) {
  const images = Array.isArray(config.images) ? (config.images as Record<string, string>[]) : [];
  if (!images.length) return null;
  return (
    <ul className="mt-4 grid gap-3 sm:grid-cols-3">
      {images.map((image) => {
        const alt = pickLocalized(locale, image.alt_en || "", image.alt_es || "");
        const caption = pickLocalized(locale, image.caption_en || "", image.caption_es || "");
        return (
          <li key={image.url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={alt.text || ""} className="h-52 w-full rounded-2xl object-cover" />
            {caption.text ? <p className="mt-1 text-sm text-muted">{caption.text}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function Upcoming({ items, slug }: { items: { id: string; title: string; when: string }[]; slug: string }) {
  return (
    <div className="mt-4">
      {items.length === 0 ? <EmptyEvents /> : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-2xl bg-background px-3 py-2">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted">{item.when}</p>
          </li>
        ))}
      </ul>
      <Link href={`/gardens/${slug}/events`} className="mt-3 inline-block font-semibold text-primary">
        <SeeAll />
      </Link>
    </div>
  );
}

async function EmptyEvents() {
  const t = await getTranslations("garden");
  return <p className="text-muted">{t("noEvents")}</p>;
}

async function SeeAll() {
  const t = await getTranslations("garden");
  return t("seeAll");
}

function Ways({ config, locale }: { config: Record<string, unknown>; locale: Language }) {
  const options = Array.isArray(config.options) ? (config.options as string[]) : [];
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <li key={option} className="rounded-2xl bg-background px-3 py-3 font-semibold">
          <WayLabel option={option} />
        </li>
      ))}
    </ul>
  );
  void locale;
}

async function WayLabel({ option }: { option: string }) {
  const t = await getTranslations("garden");
  const map: Record<string, string> = {
    bed: t("waysBed"),
    volunteer: t("waysVolunteer"),
    events: t("waysEvents"),
    produce: t("waysProduce"),
    learn: t("waysLearn"),
  };
  return map[option] ?? option;
}

function Tools({ config, locale }: { config: Record<string, unknown>; locale: Language }) {
  const items = Array.isArray(config.items) ? (config.items as Record<string, string>[]) : [];
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => {
        const name = pickLocalized(locale, item.name_en || "", item.name_es || "");
        const note = pickLocalized(locale, item.note_en || "", item.note_es || "");
        return (
          <li key={name.text}>
            <p className="font-semibold">{name.text}</p>
            {note.text ? <p className="text-sm text-muted">{note.text}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

async function GettingHere({
  garden,
  config,
  locale,
}: {
  garden: Garden;
  config: Record<string, unknown>;
  locale: Language;
}) {
  const t = await getTranslations("garden");
  const bus = pickLocalized(locale, String(config.bus_en ?? ""), String(config.bus_es ?? ""));
  const parking = pickLocalized(locale, String(config.parking_en ?? ""), String(config.parking_es ?? ""));
  const access = pickLocalized(locale, String(config.access_en ?? ""), String(config.access_es ?? ""));
  return (
    <dl className="mt-4 space-y-3">
      <div>
        <dt className="font-semibold">{garden.address}</dt>
        <dd className="text-muted">{garden.neighborhood}</dd>
      </div>
      {bus.text ? (
        <div>
          <dt className="font-semibold">{t("bus")}</dt>
          <dd>{bus.text}</dd>
        </div>
      ) : null}
      {parking.text ? (
        <div>
          <dt className="font-semibold">{t("parking")}</dt>
          <dd>{parking.text}</dd>
        </div>
      ) : null}
      {access.text ? (
        <div>
          <dt className="font-semibold">{t("access")}</dt>
          <dd>{access.text}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function News({ items, locale }: { items: Announcement[]; locale: Language }) {
  if (!items.length) return <NoNews />;
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => {
        const title = pickLocalized(locale, item.title_en, item.title_es);
        const body = pickLocalized(locale, item.body_en, item.body_es);
        return (
          <li key={item.announcement_id}>
            <p className="font-semibold">{title.text}</p>
            <p>{body.text}</p>
          </li>
        );
      })}
    </ul>
  );
}

async function NoNews() {
  const t = await getTranslations("garden");
  return <p className="mt-3 text-muted">{t("noNews")}</p>;
}

function Contact({ garden, config }: { garden: Garden; config: Record<string, unknown> }) {
  return (
    <p className="mt-3">
      <a className="font-semibold text-primary" href={`mailto:${garden.contact_email}`}>
        {garden.contact_email}
      </a>
      {garden.contact_phone ? <span className="mt-1 block">{garden.contact_phone}</span> : null}
      {config.instagram ? (
        <a className="mt-2 block text-primary" href={String(config.instagram)}>
          Instagram
        </a>
      ) : null}
    </p>
  );
}
