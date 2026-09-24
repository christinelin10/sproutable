"use client";

import { useTransition } from "react";
import { setLocale } from "@/server/auth-actions";
import type { Language } from "@/lib/types";

export function LanguageSwitcher({ locale, label }: { locale: Language; label: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center rounded-full border border-line bg-card p-1" role="group" aria-label={label}>
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          disabled={pending}
          className={`min-h-10 rounded-full px-3 text-sm font-bold ${locale === code ? "bg-primary text-primary-foreground" : ""}`}
          onClick={() => start(() => setLocale(code))}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
