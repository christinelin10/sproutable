"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { login } from "@/server/auth-actions";
import { Button } from "@/components/button";
import { DemoCredentials } from "@/components/demo-credentials";
import { Field, TextInput } from "@/components/field";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState(login, null);
  return (
    <div className="mt-6">
      <h1 className="font-game text-3xl text-[#3d2914]">{t("auth.loginTitle")}</h1>
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
      <DemoCredentials />
    </div>
  );
}
