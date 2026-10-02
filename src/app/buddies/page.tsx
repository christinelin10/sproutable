import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { acceptedBuddyIds, notesBetween, peopleNear } from "@/lib/buddies";
import { readDb } from "@/lib/data/store";
import { inviteBuddy, respondBuddy, sendBuddyNote } from "@/server/social-actions";

export default async function BuddiesPage() {
  const t = await getTranslations("buddiesPage");
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-game text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted">{t("guest")}</p>
        <Link href="/login?next=/buddies" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-4 font-semibold text-primary-foreground">
          {t("login")}
        </Link>
      </section>
    );
  }

  const db = await readDb();
  const links = db.buddyLinks ?? [];
  const notes = db.buddyNotes ?? [];
  const incoming = links.filter((link) => link.status === "pending" && link.to_user_id === user.user_id);
  const outgoing = links.filter((link) => link.status === "pending" && link.from_user_id === user.user_id);
  const friendIds = acceptedBuddyIds(links, user.user_id);
  const nameOf = (id: string) => db.users.find((person) => person.user_id === id)?.name.split(" ")[0] ?? t("someone");
  const nearby = peopleNear(db, user.user_id).filter((person) => !friendIds.includes(person.id) && !outgoing.some((link) => link.to_user_id === person.id) && !incoming.some((link) => link.from_user_id === person.id));

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/gardener" className="font-semibold text-primary underline">{t("back")}</Link>
      <h1 className="mt-3 font-game text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("body")}</p>

      <h2 className="mt-8 font-game text-3xl">{t("requests")}</h2>
      {incoming.length === 0 ? <p className="mt-3 text-muted">{t("noRequests")}</p> : null}
      <ul className="mt-3 space-y-3">
        {incoming.map((link) => (
          <li key={link.buddy_id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-4">
            <p className="font-semibold">{nameOf(link.from_user_id)}</p>
            <form action={respondBuddy}>
              <input type="hidden" name="buddy_id" value={link.buddy_id} />
              <input type="hidden" name="decision" value="accept" />
              <button className="min-h-11 rounded-full bg-primary px-4 font-semibold text-primary-foreground" type="submit">{t("accept")}</button>
            </form>
            <form action={respondBuddy}>
              <input type="hidden" name="buddy_id" value={link.buddy_id} />
              <input type="hidden" name="decision" value="decline" />
              <button className="min-h-11 rounded-full border border-line px-4 font-semibold" type="submit">{t("decline")}</button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-game text-3xl">{t("yours")}</h2>
      {friendIds.length === 0 ? <p className="mt-3 text-muted">{t("noneYet")}</p> : null}
      <ul className="mt-3 space-y-4">
        {friendIds.map((id) => {
          const thread = notesBetween(notes, user.user_id, id).slice(0, 4);
          return (
            <li key={id} className="rounded-2xl border border-line bg-card p-4">
              <p className="font-game text-2xl">{nameOf(id)}</p>
              <ul className="mt-3 space-y-2">
                {thread.map((note) => (
                  <li key={note.note_id}>
                    <span className="font-semibold">{nameOf(note.from_user_id)}: </span>
                    {note.body}
                  </li>
                ))}
              </ul>
              <form action={sendBuddyNote} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="user_id" value={id} />
                <label className="min-w-0 flex-1">
                  <span className="sr-only">{t("noteLabel")}</span>
                  <input name="body" required maxLength={280} placeholder={t("notePlaceholder")} className="min-h-11 w-full rounded-xl border border-line px-3" />
                </label>
                <button className="min-h-11 rounded-full bg-primary px-4 font-semibold text-primary-foreground" type="submit">{t("send")}</button>
              </form>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 font-game text-3xl">{t("invite")}</h2>
      <p className="mt-2 text-muted">{t("inviteBody")}</p>
      {outgoing.length > 0 ? (
        <p className="mt-3 text-sm text-muted">{t("waiting", { names: outgoing.map((link) => nameOf(link.to_user_id)).join(", ") })}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {nearby.map((person) => (
          <li key={person.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="font-semibold">{person.name}</span>
            <form action={inviteBuddy}>
              <input type="hidden" name="user_id" value={person.id} />
              <button className="min-h-11 rounded-full border border-line px-4 font-semibold" type="submit">{t("ask")}</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
