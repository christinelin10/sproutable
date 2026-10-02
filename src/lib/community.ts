import type { Database, JournalEntry } from "@/lib/types";

export type GardenStory = {
  entry: JournalEntry;
  author: string;
  gardenName: string;
  gardenSlug: string;
  bedLabel: string;
  href: string;
};

export function recentStories(db: Database, limit = 4): GardenStory[] {
  return [...db.journalEntries]
    .sort((a, b) => b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((entry) => {
      const garden = db.gardens.find((item) => item.garden_id === entry.garden_id);
      const bed = db.beds.find((item) => item.bed_id === entry.bed_id);
      const author = db.users.find((item) => item.user_id === entry.user_id)?.name.split(" ")[0] ?? "Gardener";
      const onGrowingBoard = garden?.slug === "beechview-community-garden";
      return {
        entry,
        author,
        gardenName: garden?.name ?? "",
        gardenSlug: garden?.slug ?? "",
        bedLabel: bed?.label ?? entry.crop,
        href: onGrowingBoard ? `/growing/${entry.bed_id}` : garden ? `/gardens/${garden.slug}` : "/growing",
      };
    });
}

export function gardenBuddies(db: Database, userId: string, limit = 6) {
  const mine = new Set<string>();
  for (const visit of db.visits) if (visit.user_id === userId) mine.add(visit.garden_id);
  for (const membership of db.memberships) {
    if (membership.user_id === userId && membership.status === "approved") mine.add(membership.garden_id);
  }
  for (const entry of db.journalEntries) if (entry.user_id === userId) mine.add(entry.garden_id);

  const scores = new Map<string, number>();
  const note = (id: string, gardenId: string, points: number) => {
    if (id === userId) return;
    if (mine.size > 0 && !mine.has(gardenId)) return;
    scores.set(id, (scores.get(id) ?? 0) + points);
  };
  for (const visit of db.visits) note(visit.user_id, visit.garden_id, 1);
  for (const entry of db.journalEntries) note(entry.user_id, entry.garden_id, 2);

  if (scores.size === 0) {
    for (const entry of db.journalEntries) {
      if (entry.user_id !== userId) scores.set(entry.user_id, (scores.get(entry.user_id) ?? 0) + 1);
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .flatMap(([id]) => {
      const user = db.users.find((item) => item.user_id === id);
      if (!user) return [];
      const latest = db.journalEntries
        .filter((entry) => entry.user_id === id)
        .sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0];
      return [{ id, name: user.name.split(" ")[0] ?? user.name, crop: latest?.crop ?? "", text: latest?.text ?? "" }];
    });
}
