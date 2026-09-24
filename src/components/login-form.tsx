"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login } from "@/server/auth-actions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { Button } from "@/components/button";
import { Field, TextInput } from "@/components/field";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(login, null);
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-4xl font-semibold">{t("auth.loginTitle")}</h1>
      <p className="mt-3 rounded-2xl bg-sun/40 px-4 py-3 text-sm">
        {t("auth.demo")} <strong>{DEMO_PASSWORD}</strong>
      </p>
      <ul className="mt-3 space-y-1 text-sm text-muted">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email}>
            {account.email} · {account.role}
          </li>
        ))}
      </ul>
      <form action={action} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label={t("auth.email")}>
          <TextInput name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label={t("auth.password")}>
          <TextInput name="password" type="password" autoComplete="current-password" required />
        </Field>
        {state?.error ? <p className="text-[#8d2f2f]">{t(`errors.${state.error}`)}</p> : null}
        <Button type="submit" disabled={pending}>
          {t("auth.submitLogin")}
        </Button>
      </form>
      <p className="mt-4">
        {t("auth.needAccount")} <Link href="/signup" className="font-semibold text-primary">{t("nav.signup")}</Link>
      </p>
    </div>
  );
}
