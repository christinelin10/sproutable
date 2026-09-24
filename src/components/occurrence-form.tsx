"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveOccurrence } from "@/server/garden-actions";
import { BilingualFields } from "@/components/bilingual-fields";
import { Button } from "@/components/button";

export function OccurrenceForm({
  slug,
  eventId,
  date,
  initial,
}: {
  slug: string;
  eventId: string;
  date: string;
  initial: {
    title_en: string;
    title_es: string;
    description_en: string;
    description_es: string;
    location: string;
    start_time: string;
    end_time: string;
  };
}) {
  const t = useTranslations("events");
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-3 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await saveOccurrence(slug, eventId, date, {
          title_en: String(data.get("title_en") ?? ""),
          title_es: String(data.get("title_es") ?? ""),
          description_en: String(data.get("body_en") ?? ""),
          description_es: String(data.get("body_es") ?? ""),
          location: String(data.get("location") ?? ""),
          start_time: String(data.get("start_time") ?? ""),
          end_time: String(data.get("end_time") ?? ""),
        });
        if (result?.error) setError(result.error);
      }}
    >
      <h2 className="text-2xl font-semibold">
        {t("editDate")} · {date}
      </h2>
      <BilingualFields titleEn={initial.title_en} titleEs={initial.title_es} bodyEn={initial.description_en} bodyEs={initial.description_es} />
      <label className="block font-semibold">
        {t("location")}
        <input name="location" defaultValue={initial.location} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          {t("start")}
          <input type="time" name="start_time" defaultValue={initial.start_time} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label>
          {t("end")}
          <input type="time" name="end_time" defaultValue={initial.end_time} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
      </div>
      {error ? <p className="text-[#8d2f2f]">{error}</p> : null}
      <Button type="submit">{t("save")}</Button>
    </form>
  );
}
