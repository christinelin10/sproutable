import { NavLink } from "@/components/nav-link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";
import { notFound } from "next/navigation";

export default async function GardenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const user = await getCurrentUser();
  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const hasBed = user ? db.beds.some((bed) => bed.garden_id === garden.garden_id && bed.assigned_user_id === user.user_id) : false;
  const t = await getTranslations("garden");
  const links = [
    ["/gardens/" + slug, t("home")],
    ["/gardens/" + slug + "/events", t("events")],
    ["/gardens/" + slug + "/chat", t("chat")],
    ...(manager || hasBed ? [["/gardens/" + slug + "/beds", hasBed && !manager ? t("myBed") : t("beds")]] : []),
  ];

  return (
    <div>
      <nav className="border-b border-line bg-card" aria-label={garden.name}>
        <ul className="mx-auto flex max-w-6xl gap-2 overflow-auto px-4 py-3">
          {links.map(([href, label]) => (
            <li key={href}>
              <NavLink href={href} exact={href === `/gardens/${slug}`} className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-background aria-[current=page]:bg-background">
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}
