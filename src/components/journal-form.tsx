"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveJournal } from "@/server/garden-actions";
import { Modal } from "@/components/modal";
import type { JournalEntry } from "@/lib/types";

async function shrink(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("type");
  if (file.size > 5 * 1024 * 1024) throw new Error("size");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) return file;
  return new File([blob], "photo.webp", { type: "image/webp" });
}

export function JournalForm({
  slug,
  bedId,
  today,
  entry,
}: {
  slug: string;
  bedId: string;
  today: string;
  entry?: JournalEntry;
}) {
  const t = useTranslations("beds");
  const errors = useTranslations("errors");
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState("");

  return (
    <form
      className="mt-6 space-y-3 rounded-3xl border border-line bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const files = data.getAll("photos").filter((file): file is File => file instanceof File && file.size > 0);
        data.delete("photos");
        try {
          for (const file of files.slice(0, 5)) data.append("photos", await shrink(file));
        } catch (reason) {
          setError(reason instanceof Error && (reason.message === "type" || reason.message === "size") ? "size" : "generic");
          return;
        }
        const result = await saveJournal(slug, bedId, data);
        if (result?.error) setError(result.error);
      }}
    >
      <h2 className="text-xl font-semibold">{entry ? t("edit") : t("newEntry")}</h2>
      {entry ? <input type="hidden" name="entry_id" value={entry.entry_id} /> : null}
      <label className="block">
        {t("stage")}
        <select name="stage" defaultValue={entry?.stage ?? "growing"} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          {(["planted", "growing", "maintenance", "harvest"] as const).map((stage) => (
            <option key={stage} value={stage}>
              {t(stage)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        {t("date")}
        <input type="date" name="entry_date" defaultValue={entry?.entry_date ?? today} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block">
        {t("crop")}
        <input name="crop" defaultValue={entry?.crop ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block">
        {t("entry")}
        <textarea name="text" required defaultValue={entry?.text ?? ""} rows={4} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      {entry?.image_urls.map((url) => (
        <label key={url} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remove_image" value={url} />
          {t("removePhoto")}
          <button type="button" onClick={() => setPhoto(url)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          </button>
        </label>
      ))}
      <label className="block">
        {t("photos")}
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-1 block" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          {t("amount")}
          <input name="harvest_amount" type="number" step="0.1" min="0" defaultValue={entry?.harvest_amount ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
        </label>
        <label>
          {t("unit")}
          <select name="harvest_unit" defaultValue={entry?.harvest_unit || "lb"} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </label>
      </div>
      {error ? <p className="text-[#8d2f2f]">{errors(error as "size")}</p> : null}
      <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
        {t("save")}
      </button>
      {photo ? (
        <Modal title={t("journal")} onClose={() => setPhoto("")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="w-full rounded-2xl" />
        </Modal>
      ) : null}
    </form>
  );
}

export function PhotoButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("beds");
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={t("journal")} className="h-24 w-24 rounded-xl object-cover" />
      </button>
      {open ? (
        <Modal title={t("journal")} onClose={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="w-full rounded-2xl" />
        </Modal>
      ) : null}
    </>
  );
}
