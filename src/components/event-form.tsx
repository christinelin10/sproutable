"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveEvent, type EventInput } from "@/server/garden-actions";
import { EVENT_IDEAS } from "@/lib/event-ideas";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";

const days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const;

export function EventForm({ slug, initial, eventId }: { slug: string; initial: EventInput; eventId?: string }) {
  const t = useTranslations("events");
  const [value, setValue] = useState(initial);
  const [ideas, setIdeas] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof EventInput>(key: K, next: EventInput[K]) {
    setValue((current) => ({ ...current, [key]: next }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await saveEvent(slug, value, eventId);
        if (result?.error) setError(result.error);
      }}
    >
      <div className="flex justify-between gap-3">
        <h1 className="text-3xl font-semibold">{eventId ? t("edit") : t("new")}</h1>
        <Button type="button" variant="ghost" onClick={() => setIdeas(true)}>
          {t("ideas")}
        </Button>
      </div>
      <label className="block font-semibold">
        {t("titleEn")}
        <input required value={value.title_en} onChange={(event) => set("title_en", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block font-semibold">
        {t("titleEs")}
        <input value={value.title_es} onChange={(event) => set("title_es", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block font-semibold">
        {t("bodyEn")}
        <textarea required value={value.description_en} onChange={(event) => set("description_en", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" rows={4} />
      </label>
      <label className="block font-semibold">
        {t("bodyEs")}
        <textarea value={value.description_es} onChange={(event) => set("description_es", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" rows={4} />
      </label>
      <label className="block font-semibold">
        {t("category")}
        <select value={value.category} onChange={(event) => set("category", event.target.value as EventInput["category"])} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          {(["workday", "workshop", "meal", "meeting", "other"] as const).map((category) => (
            <option key={category} value={category}>
              {t(category)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="font-semibold">
          {t("date")}
          <input type="date" required value={value.date} onChange={(event) => set("date", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="font-semibold">
          {t("start")}
          <input type="time" value={value.start_time} onChange={(event) => set("start_time", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="font-semibold">
          {t("end")}
          <input type="time" value={value.end_time} onChange={(event) => set("end_time", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
      </div>
      <label className="flex gap-2 font-semibold">
        <input type="checkbox" checked={value.all_day} onChange={(event) => set("all_day", event.target.checked)} /> {t("allDay")}
      </label>
      <label className="block font-semibold">
        {t("location")}
        <input required value={value.location} onChange={(event) => set("location", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block font-semibold">
        {t("visibility")}
        <select value={value.visibility} onChange={(event) => set("visibility", event.target.value as EventInput["visibility"])} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          <option value="public">{t("public")}</option>
          <option value="members">{t("members")}</option>
        </select>
      </label>
      <label className="block font-semibold">
        {t("capacity")}
        <input
          type="number"
          min={1}
          value={value.capacity ?? ""}
          onChange={(event) => set("capacity", event.target.value ? Number(event.target.value) : null)}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2"
        />
      </label>
      <label className="block font-semibold">
        {t("repeat")}
        <select value={value.repeat} onChange={(event) => set("repeat", event.target.value as EventInput["repeat"])} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          {(["none", "daily", "weekly", "biweekly", "monthly"] as const).map((repeat) => (
            <option key={repeat} value={repeat}>
              {t(repeat)}
            </option>
          ))}
        </select>
      </label>
      {value.repeat === "weekly" || value.repeat === "biweekly" ? (
        <fieldset className="flex flex-wrap gap-3">
          {days.map((day) => (
            <label key={day} className="flex gap-1">
              <input
                type="checkbox"
                checked={value.weekdays?.includes(day) ?? false}
                onChange={(event) => {
                  const current = new Set(value.weekdays ?? []);
                  if (event.target.checked) current.add(day);
                  else current.delete(day);
                  set("weekdays", Array.from(current) as EventInput["weekdays"]);
                }}
              />
              {day}
            </label>
          ))}
        </fieldset>
      ) : null}
      {value.repeat !== "none" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="font-semibold">
            {t("ends")}
            <select value={value.ends} onChange={(event) => set("ends", event.target.value as EventInput["ends"])} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
              <option value="until">{t("onDate")}</option>
              <option value="count">{t("after")}</option>
            </select>
          </label>
          {value.ends === "count" ? (
            <label className="font-semibold">
              {t("times")}
              <input type="number" min={1} max={60} value={value.count ?? 4} onChange={(event) => set("count", Number(event.target.value))} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
            </label>
          ) : (
            <label className="font-semibold">
              {t("date")}
              <input type="date" value={value.until} onChange={(event) => set("until", event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
            </label>
          )}
        </div>
      ) : null}
      {error ? <p className="text-[#8d2f2f]">{error}</p> : null}
      <Button type="submit">{t("save")}</Button>
      {ideas ? (
        <Modal title={t("ideas")} onClose={() => setIdeas(false)}>
          <ul className="space-y-3">
            {EVENT_IDEAS.map((idea) => (
              <li key={idea.id} className="rounded-2xl border border-line p-3">
                <p className="font-semibold">{idea.title_en}</p>
                <p className="text-sm text-muted">{idea.title_es}</p>
                <button
                  type="button"
                  className="mt-2 font-semibold text-primary"
                  onClick={() => {
                    setValue((current) => ({
                      ...current,
                      title_en: idea.title_en,
                      title_es: idea.title_es,
                      description_en: idea.description_en,
                      description_es: idea.description_es,
                      category: idea.category,
                    }));
                    setIdeas(false);
                  }}
                >
                  {t("useIdea")}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      ) : null}
    </form>
  );
}
