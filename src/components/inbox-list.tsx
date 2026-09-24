"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function InboxList({
  items,
}: {
  items: { id: string; group: "today" | "week" | "earlier"; kind: string; summary: string; href: string; garden: string; unread: boolean }[];
}) {
  const t = useTranslations("inbox");
  const [filter, setFilter] = useState<"all" | "events" | "announcements">("all");
  const visible = items.filter((item) => filter === "all" || (filter === "events" ? item.kind.startsWith("event") : item.kind === "announcement"));
  const groups = ["today", "week", "earlier"] as const;
  return (
    <div>
      <div className="mt-4 flex gap-2">
        {(["all", "events", "announcements"] as const).map((key) => (
          <button key={key} type="button" aria-pressed={filter === key} className={`rounded-full px-3 py-2 font-semibold ${filter === key ? "bg-primary text-primary-foreground" : "bg-card"}`} onClick={() => setFilter(key)}>
            {t(key)}
          </button>
        ))}
      </div>
      {visible.length === 0 ? <p className="mt-8 text-muted">{t("empty")}</p> : null}
      {groups.map((group) => {
        const rows = visible.filter((item) => item.group === group);
        if (!rows.length) return null;
        return (
          <section key={group} className="mt-6">
            <h2 className="text-xl font-semibold">{t(group)}</h2>
            <ul className="mt-2 space-y-2">
              {rows.map((item) => (
                <li key={item.id}>
                  <a href={item.href} className={`block rounded-2xl border border-line bg-card p-4 ${item.unread ? "border-primary" : ""}`}>
                    <span className="text-sm font-semibold text-muted">{item.garden}</span>
                    <span className="mt-1 block">{item.summary}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
