"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function BilingualFields({
  titleEn = "",
  titleEs = "",
  bodyEn = "",
  bodyEs = "",
}: {
  titleEn?: string;
  titleEs?: string;
  bodyEn?: string;
  bodyEs?: string;
}) {
  const t = useTranslations("builder");
  const [tab, setTab] = useState<"en" | "es">("en");
  const [values, setValues] = useState({ titleEn, titleEs, bodyEn, bodyEs });
  const [note, setNote] = useState("");

  function insert(token: string) {
    const key = tab === "en" ? "bodyEn" : "bodyEs";
    setValues((current) => ({ ...current, [key]: `${current[key]}${current[key] ? "\n" : ""}${token}` }));
  }

  async function translate() {
    setNote("");
    const response = await fetch(`/api/translate?q=${encodeURIComponent(values.bodyEn)}`);
    const data = await response.json();
    if (!response.ok || !data.text) {
      setNote(t("translateError"));
      return;
    }
    setValues((current) => ({ ...current, bodyEs: data.text, titleEs: current.titleEs || data.title || current.titleEs }));
    if (values.titleEn) {
      const titleResponse = await fetch(`/api/translate?q=${encodeURIComponent(values.titleEn)}`);
      const titleData = await titleResponse.json();
      if (titleResponse.ok && titleData.text) setValues((current) => ({ ...current, titleEs: titleData.text }));
    }
    setTab("es");
    setNote(t("translateDone"));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={tab === "en"} className={`rounded-full px-3 py-1 ${tab === "en" ? "bg-primary text-primary-foreground" : "border border-line"}`} onClick={() => setTab("en")}>
          {t("english")}
        </button>
        <button type="button" aria-pressed={tab === "es"} className={`rounded-full px-3 py-1 ${tab === "es" ? "bg-primary text-primary-foreground" : "border border-line"}`} onClick={() => setTab("es")}>
          {t("spanish")}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => insert("**bold**")}>
          {t("bold")}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => insert("*italic*")}>
          {t("italic")}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => insert("- ")}>
          {t("list")}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => insert("[text](https://)")}>
          {t("link")}
        </button>
        <button type="button" className="rounded-full border border-line px-3 py-1" onClick={() => void translate()}>
          {t("translate")}
        </button>
      </div>
      {note ? <p className="text-sm text-muted">{note}</p> : null}
      <input name="title_en" value={values.titleEn} onChange={(event) => setValues({ ...values, titleEn: event.target.value })} className={`w-full rounded-xl border border-line px-3 py-2 ${tab === "en" ? "" : "hidden"}`} />
      <textarea name="body_en" value={values.bodyEn} onChange={(event) => setValues({ ...values, bodyEn: event.target.value })} rows={4} className={`w-full rounded-xl border border-line px-3 py-2 ${tab === "en" ? "" : "hidden"}`} />
      <input name="title_es" value={values.titleEs} onChange={(event) => setValues({ ...values, titleEs: event.target.value })} className={`w-full rounded-xl border border-line px-3 py-2 ${tab === "es" ? "" : "hidden"}`} />
      <textarea name="body_es" value={values.bodyEs} onChange={(event) => setValues({ ...values, bodyEs: event.target.value })} rows={4} className={`w-full rounded-xl border border-line px-3 py-2 ${tab === "es" ? "" : "hidden"}`} />
    </div>
  );
}
