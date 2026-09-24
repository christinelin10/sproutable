"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signup } from "@/server/auth-actions";
import { Button } from "@/components/button";
import { Field, TextArea, TextInput } from "@/components/field";

const options = [
  ["bed", "waysBed"],
  ["volunteer", "waysVolunteer"],
  ["events", "waysEvents"],
  ["produce", "waysProduce"],
  ["learn", "waysLearn"],
] as const;

export function SignupForm({ initialType }: { initialType?: string }) {
  const t = useTranslations();
  const [account, setAccount] = useState(initialType === "manager" ? "manager" : "user");
  const [state, action, pending] = useActionState(signup, null);
  const browserSpanish = typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("es");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-semibold">{t("auth.signupTitle")}</h1>
      <form action={action} className="mt-6 space-y-4">
        <fieldset className="grid gap-3 sm:grid-cols-2">
          <legend className="sr-only">{t("auth.signupTitle")}</legend>
          {[
            ["user", t("auth.joinGarden")],
            ["manager", t("auth.manageGarden")],
          ].map(([value, label]) => (
            <label key={value} className={`rounded-2xl border p-4 ${account === value ? "border-primary bg-white" : "border-line"}`}>
              <input type="radio" name="account_type" value={value} checked={account === value} onChange={() => setAccount(value)} />
              <span className="ml-2 font-semibold">{label}</span>
            </label>
          ))}
        </fieldset>
        <Field label={t("auth.name")}>
          <TextInput name="name" required autoComplete="name" />
        </Field>
        <Field label={t("auth.email")}>
          <TextInput name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label={t("auth.password")} hint={t("errors.password")}>
          <TextInput name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label={t("auth.phone")}>
          <TextInput name="phone" autoComplete="tel" />
        </Field>
        <Field label={t("auth.language")}>
          <select name="language" defaultValue={browserSpanish ? "es" : "en"} className="w-full rounded-xl border border-line bg-white px-3 py-2">
            <option value="en">{t("auth.english")}</option>
            <option value="es">{t("auth.spanish")}</option>
          </select>
        </Field>
        {account === "manager" ? (
          <div className="space-y-4 rounded-3xl border border-line bg-card p-4">
            <Field label={t("auth.gardenName")}>
              <TextInput name="garden_name" required={account === "manager"} />
            </Field>
            <Field label={t("auth.address")}>
              <TextInput name="address" required={account === "manager"} />
            </Field>
            <Field label={t("auth.neighborhood")}>
              <TextInput name="neighborhood" required={account === "manager"} />
            </Field>
            <Field label={t("auth.description")}>
              <TextArea name="description_en" required={account === "manager"} rows={3} />
            </Field>
            <Field label={t("auth.descriptionEs")}>
              <TextArea name="description_es" rows={3} />
            </Field>
            <Field label={t("auth.contactEmail")}>
              <TextInput name="contact_email" type="email" required={account === "manager"} />
            </Field>
            <Field label={t("auth.contactPhone")}>
              <TextInput name="contact_phone" />
            </Field>
            <Field label={t("auth.year")}>
              <TextInput name="year_founded" />
            </Field>
            <Field label={t("auth.beds")}>
              <TextInput name="bed_count" />
            </Field>
            <fieldset>
              <legend className="font-semibold">{t("auth.involved")}</legend>
              {options.map(([key, label]) => (
                <label key={key} className="mt-2 flex gap-2">
                  <input type="checkbox" name={`inv_${key}`} defaultChecked={key === "volunteer" || key === "events"} />
                  {t(`garden.${label}`)}
                </label>
              ))}
            </fieldset>
          </div>
        ) : null}
        {state?.error ? <p className="text-[#8d2f2f]">{t(`errors.${state.error}`)}</p> : null}
        <Button type="submit" disabled={pending}>
          {t("auth.submitSignup")}
        </Button>
      </form>
      <p className="mt-4">
        {t("auth.haveAccount")} <Link href="/login" className="font-semibold text-primary">{t("nav.login")}</Link>
      </p>
    </div>
  );
}
