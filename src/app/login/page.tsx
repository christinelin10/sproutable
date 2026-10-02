import { getLocale, getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import type { Language } from "@/lib/types";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const t = await getTranslations("village");
  const nav = await getTranslations("nav");
  const locale = (await getLocale()) as Language;
  return (
    <section className="mx-auto max-w-lg px-4 py-8">
      <div className="game-panel bg-[#fffdf8] p-6 sm:p-8">
        <p className="font-game text-4xl text-[#215c45]">Sproutable</p>
        <p className="mt-2 text-lg text-muted">{t("loginLead")}</p>
        <div className="mt-4">
          <LanguageSwitcher locale={locale} label={nav("language")} />
        </div>
        <LoginForm next={next} />
      </div>
    </section>
  );
}
