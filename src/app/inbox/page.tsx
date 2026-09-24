import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { InboxList } from "@/components/inbox-list";
import { MarkSeen } from "@/components/mark-seen";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { inboxGroup, inboxItems, isUnread } from "@/lib/inbox";
import { pickLocalized } from "@/lib/text";
import type { Language } from "@/lib/types";

export default async function InboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/inbox");
  const db = await readDb();
  const t = await getTranslations("inbox");
  const locale = (await getLocale()) as Language;
  const items = inboxItems(db, user).map((item) => {
    const garden = db.gardens.find((row) => row.garden_id === item.garden_id);
    const summary = pickLocalized(locale, item.summary_en, item.summary_es);
    const href =
      item.type === "announcement"
        ? `/gardens/${garden?.slug ?? ""}`
        : item.type.startsWith("membership")
          ? "/dashboard"
          : `/gardens/${garden?.slug ?? ""}/events`;
    return {
      id: item.activity_id,
      group: inboxGroup(item.created_at, garden?.timezone),
      kind: item.type,
      summary: summary.text,
      href,
      garden: garden?.name ?? "",
      unread: isUnread(db, user, item),
    };
  });

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-semibold">{t("title")}</h1>
        <form action={async () => {
          "use server";
          const { markInboxRead } = await import("@/server/garden-actions");
          await markInboxRead();
        }}>
          <button className="rounded-full border border-line px-3 py-2 font-semibold" type="submit">
            {t("mark")}
          </button>
        </form>
      </div>
      <MarkSeen />
      <InboxList items={items} />
    </section>
  );
}
