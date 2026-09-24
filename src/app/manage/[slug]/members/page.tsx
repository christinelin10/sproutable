import { getLocale, getTranslations } from "next-intl/server";
import { readDb } from "@/lib/data/store";
import { formatDate } from "@/lib/format";
import { gardenBySlug, isChatBanned, userById } from "@/lib/permissions";
import { decideMembership, removeMember, restoreChat } from "@/server/garden-actions";
import type { Language } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { tab = "requests", q = "" } = await searchParams;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) notFound();
  const t = await getTranslations("members");
  const locale = (await getLocale()) as Language;
  const rows = db.memberships.filter((item) => item.garden_id === garden.garden_id);
  const query = q.trim().toLowerCase();

  return (
    <section>
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <div className="mt-4 flex gap-2">
        {["requests", "members", "removed"].map((key) => (
          <a key={key} href={`?tab=${key}`} className={`rounded-full px-3 py-2 font-semibold ${tab === key ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {key === "requests" ? t("requests") : key === "members" ? t("people") : t("removed")}
          </a>
        ))}
      </div>
      {tab === "requests" ? (
        <ul className="mt-6 space-y-3">
          {rows.filter((row) => row.status === "pending").length === 0 ? <li className="text-muted">{t("emptyRequests")}</li> : null}
          {rows
            .filter((row) => row.status === "pending")
            .map((row) => {
              const person = userById(db, row.user_id);
              return (
                <li key={row.membership_id} className="rounded-2xl border border-line bg-card p-4">
                  <p className="text-xl font-semibold">{person?.name}</p>
                  <p>{person?.email}</p>
                  {row.note ? <p className="mt-2">{row.note}</p> : null}
                  <p className="text-sm text-muted">
                    {t("requested")} {formatDate(row.requested_at, locale, garden.timezone)} · {row.interests}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <form action={decideMembership.bind(null, garden.garden_id, row.membership_id, "approved")}>
                      <button className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit">
                        {t("approve")}
                      </button>
                    </form>
                    <form action={decideMembership.bind(null, garden.garden_id, row.membership_id, "rejected")}>
                      <button className="rounded-full border border-line px-4 py-2 font-semibold" type="submit">
                        {t("decline")}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
        </ul>
      ) : null}
      {tab === "members" ? (
        <div className="mt-6">
          <form>
            <input type="hidden" name="tab" value="members" />
            <label className="font-semibold">
              {t("search")}
              <input name="q" defaultValue={q} className="mt-1 block w-full max-w-sm rounded-xl border border-line px-3 py-2" />
            </label>
          </form>
          <ul className="mt-4 space-y-3">
            {rows.filter((row) => row.status === "approved").length === 0 ? <li className="text-muted">{t("emptyMembers")}</li> : null}
            {rows
              .filter((row) => row.status === "approved")
              .filter((row) => {
                const person = userById(db, row.user_id);
                return !query || person?.name.toLowerCase().includes(query) || person?.email.toLowerCase().includes(query);
              })
              .map((row) => {
                const person = userById(db, row.user_id);
                const beds = db.beds.filter((bed) => bed.assigned_user_id === row.user_id).map((bed) => bed.label);
                const banned = person ? isChatBanned(db, person.user_id, garden.garden_id) : false;
                return (
                  <li key={row.membership_id} className="rounded-2xl border border-line bg-card p-4">
                    <p className="text-xl font-semibold">{person?.name}</p>
                    <p>{person?.email}</p>
                    <p className="text-sm text-muted">
                      {t("since")} {formatDate(row.decided_at || row.requested_at, locale, garden.timezone)}
                      {beds.length ? ` · ${t("bed")}: ${beds.join(", ")}` : ""}
                      {banned ? ` · ${t("chatBanned")}` : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <form action={removeMember.bind(null, garden.garden_id, row.membership_id)}>
                        <button className="rounded-full bg-[#8d2f2f] px-4 py-2 font-semibold text-white" type="submit">
                          {t("remove")}
                        </button>
                      </form>
                      {banned && person ? (
                        <form action={restoreChat.bind(null, garden.garden_id, person.user_id)}>
                          <button className="rounded-full border border-line px-4 py-2 font-semibold" type="submit">
                            {t("restoreChat")}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      ) : null}
      {tab === "removed" ? (
        <ul className="mt-6 space-y-3">
          {rows.filter((row) => row.status === "removed").length === 0 ? <li className="text-muted">{t("emptyRemoved")}</li> : null}
          {rows
            .filter((row) => row.status === "removed")
            .map((row) => (
              <li key={row.membership_id}>{userById(db, row.user_id)?.name}</li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
