"use client";

import { useTranslations } from "next-intl";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <section className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-3xl font-semibold">{t("common.dataError")}</h1>
      <button className="mt-6 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" onClick={reset} type="button">
        {t("common.retry")}
      </button>
    </section>
  );
}
