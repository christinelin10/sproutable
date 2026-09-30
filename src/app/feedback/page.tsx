import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FeedbackForm } from "@/components/feedback-form";

const FORM_PAGE =
  "https://docs.google.com/forms/d/e/1FAIpQLSeeEoVliPu2yjFemTXbeFQizPkZYnBTie4emB7d0Wl6AZSPJA/viewform";

export default async function FeedbackPage() {
  const t = await getTranslations("feedback");
  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <p className="font-semibold text-primary">
        <Link href="/" className="underline">
          {t("home")}
        </Link>
      </p>
      <h1 className="mt-2 text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("body")}</p>
      <div className="mt-6">
        <FeedbackForm title={t("formTitle")} />
      </div>
      <p className="mt-4">
        <a href={FORM_PAGE} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
          {t("open")}
        </a>
      </p>
    </section>
  );
}
