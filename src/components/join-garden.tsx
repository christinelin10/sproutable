"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { requestJoin } from "@/server/garden-actions";
import { Modal } from "@/components/modal";
import { Button } from "@/components/button";

const options = ["bed", "volunteer", "events", "produce", "learn"] as const;

export function JoinGarden({
  gardenId,
  loggedIn,
  status,
  loginHref,
}: {
  gardenId: string;
  loggedIn: boolean;
  status: string;
  loginHref: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(status === "pending");
  const [error, setError] = useState("");

  if (status === "approved") return null;
  if (pending) {
    return <p className="inline-flex rounded-full bg-white/15 px-4 py-2 font-semibold">{t("garden.requestSent")}</p>;
  }
  if (!loggedIn) {
    return (
      <a href={loginHref} className="inline-flex rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground">
        {t("garden.loginToJoin")}
      </a>
    );
  }

  return (
    <>
      <button type="button" className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground" onClick={() => setOpen(true)}>
        {t("garden.join")}
      </button>
      {open ? (
        <Modal title={t("join.title")} onClose={() => setOpen(false)}>
          <form
            action={async (formData) => {
              const result = await requestJoin(gardenId, formData);
              if (result?.error) setError(result.error);
              else {
                setPending(true);
                setOpen(false);
              }
            }}
            className="space-y-3"
          >
            <label className="block font-semibold">
              {t("join.note")}
              <textarea name="note" className="mt-1 w-full rounded-xl border border-line px-3 py-2" rows={3} />
            </label>
            <fieldset>
              <legend className="font-semibold">{t("members.interests")}</legend>
              {options.map((option) => (
                <label key={option} className="mt-2 flex items-center gap-2">
                  <input type="checkbox" name={`inv_${option}`} />
                  {t(`garden.ways${option === "bed" ? "Bed" : option === "volunteer" ? "Volunteer" : option === "events" ? "Events" : option === "produce" ? "Produce" : "Learn"}`)}
                </label>
              ))}
            </fieldset>
            {error ? <p className="text-[#8d2f2f]">{t(`errors.${error}`)}</p> : null}
            <Button type="submit">{t("join.send")}</Button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
