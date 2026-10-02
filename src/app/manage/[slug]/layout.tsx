import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NavLink } from "@/components/nav-link";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";

export default async function ManageLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/manage/${slug}`);
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations();
  if (!managesGarden(db, user.user_id, garden.garden_id)) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-semibold">{t("errors.denied")}</h1>
        <p className="mt-3 text-muted">{t("errors.deniedBody")}</p>
        <Link href="/gardens" className="mt-6 inline-block font-semibold text-primary">
          {t("errors.home")}
        </Link>
      </section>
    );
  }
  const pending = db.memberships.filter((item) => item.garden_id === garden.garden_id && item.status === "pending").length;
  const links = [
    ["", t("manage.overview")],
    ["/page-builder", t("manage.page")],
    ["/events", t("manage.events")],
    ["/members", `${t("manage.members")}${pending ? ` (${pending})` : ""}`],
    ["/gardeners", t("manage.gardeners")],
    ["/beds", t("manage.beds")],
    ["/announcements", t("manage.announcements")],
    ["/impact", t("manage.impact")],
    ["/settings", t("manage.settings")],
  ];
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside>
        <p className="font-semibold text-primary">{garden.name}</p>
        <nav className="mt-3 flex gap-2 overflow-auto md:block" aria-label={t("manage.title")}>
          {links.map(([href, label]) => (
            <NavLink
              key={href}
              href={`/manage/${slug}${href}`}
              exact={href === ""}
              className="block min-h-11 rounded-xl px-3 py-2 font-semibold hover:bg-card aria-[current=page]:bg-card"
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
