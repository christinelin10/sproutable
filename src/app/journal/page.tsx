import Link from "next/link";
import { DateTime } from "luxon";
import { getLocale, getTranslations } from "next-intl/server";
import { JournalForm } from "@/components/journal-form";
import { StoryCard } from "@/components/game/story-card";
import { getCurrentUser } from "@/lib/auth";
import { recentStories } from "@/lib/community";
import { readDb } from "@/lib/data/store";
import type { Language } from "@/lib/types";

export default async function JournalPage() {
  const t = await getTranslations("journalHub");
  const locale = (await getLocale()) as Language;
  const user = await getCurrentUser();
  const db = await readDb();
  const stories = recentStories(db, 4);
  const beds = user
    ? db.beds
        .filter((bed) => bed.assigned_user_id === user.user_id)
        .map((bed) => ({ bed, garden: db.gardens.find((garden) => garden.garden_id === bed.garden_id) }))
        .filter((item) => item.garden)
    : [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/" className="font-semibold text-primary underline">
        {t("home")}
      </Link>
      <h1 className="mt-3 font-game text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("body")}</p>
      <p className="mt-2 text-sm text-muted">{t("savedHint")}</p>

      {!user ? (
        <div className="mt-6 rounded-2xl border border-line bg-card p-5">
          <p>{t("guest")}</p>
          <Link href="/login?next=/journal" className="game-btn mt-4 inline-flex min-h-11 items-center bg-[#215c45] px-4 font-semibold text-[#f7f3ea]">
            {t("login")}
          </Link>
        </div>
      ) : beds.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-line bg-card p-5">
          <p>{t("none")}</p>
          <Link href="/gardens" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline">
            {t("find")}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <h2 className="font-game text-3xl">{t("yourBeds")}</h2>
          {beds.map(({ bed, garden }) =>
            garden ? (
              <div key={bed.bed_id}>
                <p className="font-semibold text-primary">
                  {garden.name} · {bed.label}
                </p>
                <JournalForm slug={garden.slug} bedId={bed.bed_id} today={today} />
              </div>
            ) : null,
          )}
        </div>
      )}

      <h2 className="mt-10 font-game text-3xl">{t("recent")}</h2>
      <ul className="mt-4 space-y-3">
        {stories.map((story) => (
          <li key={story.entry.entry_id}>
            <StoryCard
              href={story.href}
              author={story.author}
              garden={story.gardenName}
              crop={story.entry.crop || story.bedLabel}
              when={DateTime.fromISO(story.entry.entry_date).setLocale(locale).toFormat("ccc LLL d")}
              text={story.entry.text}
              action={t("open")}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
