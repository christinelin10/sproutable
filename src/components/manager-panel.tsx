"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { addManager, removeManager } from "@/server/garden-actions";

export function ManagerPanel({
  slug,
  managers,
}: {
  slug: string;
  managers: { user_id: string; name: string; email: string }[];
}) {
  const t = useTranslations("settings");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [error, setError] = useState("");

  return (
    <div className="mt-10 max-w-xl">
      <h2 className="text-2xl font-semibold">{t("managers")}</h2>
      <ul className="mt-3 space-y-2">
        {managers.map((person) => (
          <li key={person.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <span>
              <span className="font-semibold">{person.name}</span>
              <span className="block text-sm text-muted">{person.email}</span>
            </span>
            <button
              type="button"
              className="text-sm font-semibold"
              onClick={async () => {
                const result = await removeManager(slug, person.user_id);
                if (result?.error) setError(result.error);
                else {
                  setError("");
                  router.refresh();
                }
              }}
            >
              {t("removeManager")}
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await addManager(slug, new FormData(event.currentTarget));
          if (result?.error) setError(result.error);
          else {
            setError("");
            event.currentTarget.reset();
            router.refresh();
          }
        }}
      >
        <input name="email" type="email" required placeholder={t("managerEmail")} className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2" />
        <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
          {t("addManager")}
        </button>
      </form>
      {error ? <p className="mt-2 text-[#8d2f2f]">{errors(error as "email")}</p> : null}
    </div>
  );
}
