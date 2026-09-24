import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CopyLink } from "@/components/copy-link";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { unreadCount } from "@/lib/inbox";
import { pickLocalized } from "@/lib/text";
import { managesGarden } from "@/lib/permissions";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  const { welcome } = await searchParams;
  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const db = await readDb();
  const managed = db.gardens.filter((garden) => managesGarden(db, user.user_id, garden.garden_id));
  const memberships = db.memberships.filter((item) => item.user_id === user.user_id);
  const updates = unreadCount(db, user);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("title")}</h1>
      {updates > 0 ? (
        <p className="mt-4 rounded-2xl bg-sun/40 px-4 py-3">
          {updates} {t("updates")}. <Link href="/inbox" className="font-semibold">{t("openInbox")}</Link>
        </p>
      ) : null}
      {managed.map((garden) => {
        const pending = db.memberships.filter((item) => item.garden_id === garden.garden_id && item.status === "pending").length;
        const hasEvent = db.events.some((event) => event.garden_id === garden.garden_id);
        return (
          <article key={garden.garden_id} className="mt-6 rounded-3xl border border-line bg-card p-6">
            <h2 className="text-2xl font-semibold">{garden.name}</h2>
            {welcome ? <p className="mt-2 text-muted">{t("welcomeManager")}</p> : null}
            <ul className="mt-4 space-y-2">
              <li>
                <Link className="font-semibold text-primary" href={`/manage/${garden.slug}/page-builder`}>
                  {t("checklistPage")}
                </Link>
              </li>
              <li>
                {hasEvent ? "✓ " : ""}
                <Link className="font-semibold text-primary" href={`/manage/${garden.slug}/events/new`}>
                  {t("checklistEvent")}
                </Link>
              </li>
              <li className="flex flex-wrap items-center gap-3">
                <span>{t("checklistShare")}</span>
                <CopyLink href={`/gardens/${garden.slug}`} label={t("copy")} done={t("copied")} />
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/manage/${garden.slug}`} className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">
                {t("manage")}
              </Link>
              <Link href={`/gardens/${garden.slug}`} className="rounded-full border border-line px-4 py-2 font-semibold">
                {t("view")}
              </Link>
              {pending ? (
                <Link href={`/manage/${garden.slug}/members`} className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
                  {pending} {t("pending")}
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
      <h2 className="mt-10 text-2xl font-semibold">{t("yourGardens")}</h2>
      <ul className="mt-3 space-y-2">
        {memberships.filter((item) => item.status === "approved").map((item) => {
          const garden = db.gardens.find((row) => row.garden_id === item.garden_id);
          if (!garden) return null;
          return (
            <li key={item.membership_id}>
              <Link className="font-semibold text-primary" href={`/gardens/${garden.slug}`}>
                {garden.name}
              </Link>
            </li>
          );
        })}
        {memberships.filter((item) => item.status === "approved").length === 0 ? <li className="text-muted">{t("empty")}</li> : null}
      </ul>
      <h2 className="mt-8 text-2xl font-semibold">{t("requests")}</h2>
      <ul className="mt-3 space-y-2">
        {memberships.filter((item) => item.status === "pending" || item.status === "rejected").map((item) => {
          const garden = db.gardens.find((row) => row.garden_id === item.garden_id);
          return (
            <li key={item.membership_id}>
              {garden?.name} · {item.status}
            </li>
          );
        })}
      </ul>
      <h2 className="mt-8 text-2xl font-semibold">{t("myBeds")}</h2>
      <ul className="mt-3 space-y-2">
        {db.beds
          .filter((bed) => bed.assigned_user_id === user.user_id)
          .map((bed) => {
            const garden = db.gardens.find((row) => row.garden_id === bed.garden_id);
            if (!garden) return null;
            return (
              <li key={bed.bed_id}>
                <Link className="font-semibold text-primary" href={`/gardens/${garden.slug}/beds/${bed.bed_id}`}>
                  {garden.name} · {bed.label}
                </Link>
              </li>
            );
          })}
      </ul>
      <h2 className="mt-8 text-2xl font-semibold">{t("mail")}</h2>
      <ul className="mt-3 space-y-3">
        {db.emails.filter((mail) => mail.to_email === user.email).length === 0 ? <li className="text-muted">{t("mailEmpty")}</li> : null}
        {db.emails
          .filter((mail) => mail.to_email === user.email)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((mail) => {
            const subject = pickLocalized(locale === "es" ? "es" : "en", mail.subject_en, mail.subject_es);
            const body = pickLocalized(locale === "es" ? "es" : "en", mail.body_en, mail.body_es);
            return (
              <li key={mail.email_id} className="rounded-2xl border border-line bg-card p-4">
                <p className="font-semibold">{subject.text}</p>
                <p className="mt-1 text-sm">{body.text}</p>
              </li>
            );
          })}
      </ul>
      <Link href="/gardens" className="mt-6 inline-block font-semibold text-primary">
        {t("browse")}
      </Link>
    </section>
  );
}
