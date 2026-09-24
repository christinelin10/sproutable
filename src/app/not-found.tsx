import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-4xl font-semibold">404</h1>
      <Link href="/gardens" className="mt-6 inline-block font-semibold text-primary">
        {t("home")}
      </Link>
    </section>
  );
}
