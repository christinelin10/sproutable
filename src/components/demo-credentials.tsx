"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";

export function DemoCredentials() {
  const t = useTranslations("auth");
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<"user" | "manager">("user");
  const [copied, setCopied] = useState("");
  const accounts = DEMO_ACCOUNTS.filter((account) => account.group === group);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(key);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open ? (
        <section className="w-80 rounded-2xl border border-line bg-card p-3 shadow-lg" aria-label={t("credentials")}>
          <h2 className="text-lg font-semibold">{t("credentials")}</h2>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["user", "manager"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={group === value}
                className={`rounded-full px-3 py-1 font-semibold ${group === value ? "bg-primary text-primary-foreground" : "border border-line"}`}
                onClick={() => setGroup(value)}
              >
                {value === "user" ? t("credentialUser") : t("credentialManager")}
              </button>
            ))}
          </div>
          <ul className="mt-3 max-h-80 space-y-3 overflow-auto">
            {accounts.map((account) => (
              <li key={account.email} className="rounded-xl border border-line p-2 text-sm">
                <p className="font-semibold">{account.name}</p>
                <p className="text-muted">{account.note}</p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{account.email}</span>
                  <CopyButton label={t("copy")} copied={copied === account.email} done={t("copied")} onCopy={() => copy(account.email, account.email)} />
                </p>
                <p className="mt-1 flex items-center gap-2">
                  <span className="min-w-0 flex-1">{DEMO_PASSWORD}</span>
                  <CopyButton label={t("copy")} copied={copied === `${account.email}-password`} done={t("copied")} onCopy={() => copy(DEMO_PASSWORD, `${account.email}-password`)} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
        onClick={() => setOpen((current) => !current)}
      >
        {t("credentials")}
      </button>
    </div>
  );
}

function CopyButton({ label, copied, done, onCopy }: { label: string; copied: boolean; done: string; onCopy: () => void }) {
  return (
    <button type="button" className="rounded-lg border border-line p-1" aria-label={copied ? done : label} onClick={() => void onCopy()}>
      {copied ? (
        <span className="block px-1 text-xs font-semibold">{done}</span>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}
