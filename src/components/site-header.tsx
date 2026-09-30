import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { logout } from "@/server/auth-actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLink } from "@/components/nav-link";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { unreadCount } from "@/lib/inbox";
import type { Language } from "@/lib/types";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const locale = (await getLocale()) as Language;
  const user = await getCurrentUser();
  const db = user ? await readDb() : null;
  const unread = user && db ? unreadCount(db, user) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-[#f7f1e4]/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-1 text-xl font-bold tracking-tight text-primary">
          Sproutable
        </Link>
        <nav className="flex flex-wrap items-center gap-1" aria-label={t("primary")}>
          <NavLink href="/gardens" className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-white aria-[current=page]:bg-white">
            {t("gardens")}
          </NavLink>
          <NavLink href="/map" className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-white aria-[current=page]:bg-white">
            {t("map")}
          </NavLink>
          <NavLink href="/events" className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-white aria-[current=page]:bg-white">
            {t("eventBoard")}
          </NavLink>
          <NavLink href="/growing" className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-white aria-[current=page]:bg-white">
            {t("growing")}
          </NavLink>
          <NavLink href="/feedback" className="inline-flex min-h-11 items-center rounded-full px-3 font-semibold hover:bg-white aria-[current=page]:bg-white">
            {t("feedback")}
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={t("language")} />
          {user ? (
            <>
              <Link href="/inbox" className="relative rounded-full px-3 py-2 font-semibold hover:bg-white" aria-label={t("inbox")}>
                {t("inbox")}
                {unread > 0 ? (
                  <span className="ml-2 inline-flex min-w-6 justify-center rounded-full bg-accent px-1.5 text-sm text-accent-foreground">
                    {unread}
                  </span>
                ) : null}
              </Link>
              <details className="relative">
                <summary aria-label={t("menu")} className="cursor-pointer list-none rounded-full border border-line bg-card px-3 py-2 font-semibold">
                  {user.name.split(" ")[0]}
                </summary>
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-line bg-card p-2 shadow-lg">
                  <Link className="block rounded-xl px-3 py-2 hover:bg-background" href="/dashboard">
                    {t("dashboard")}
                  </Link>
                  <Link className="block rounded-xl px-3 py-2 hover:bg-background" href="/settings/profile">
                    {t("profile")}
                  </Link>
                  <form action={logout}>
                    <button className="w-full rounded-xl px-3 py-2 text-left hover:bg-background" type="submit">
                      {t("logout")}
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 font-semibold">
                {t("login")}
              </Link>
              <Link href="/signup" className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
