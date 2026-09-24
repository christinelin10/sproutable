"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/server/auth-actions";
import { Button } from "@/components/button";
import type { User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="mx-auto max-w-lg space-y-4 px-4 py-10">
      <h1 className="text-4xl font-semibold">{t("settings.profile")}</h1>
      <label className="block font-semibold">
        {t("auth.name")}
        <input name="name" defaultValue={user.name} required className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <p className="text-muted">{user.email}</p>
      <label className="block font-semibold">
        {t("auth.phone")}
        <input name="phone" defaultValue={user.phone} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block font-semibold">
        {t("auth.language")}
        <select name="language" defaultValue={user.language} className="mt-1 w-full rounded-xl border border-line px-3 py-2">
          <option value="en">{t("auth.english")}</option>
          <option value="es">{t("auth.spanish")}</option>
        </select>
      </label>
      <label className="block font-semibold">
        {t("members.interests")}
        <input name="interest_tags" defaultValue={user.interest_tags} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      <label className="block font-semibold">
        {t("settings.newPassword")}
        <input name="new_password" type="password" minLength={8} className="mt-1 w-full rounded-xl border border-line px-3 py-2" />
      </label>
      {state?.error ? <p className="text-[#8d2f2f]">{t(`errors.${state.error}`)}</p> : null}
      <Button type="submit" disabled={pending}>
        {t("settings.saveProfile")}
      </Button>
    </form>
  );
}
