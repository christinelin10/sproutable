import type { Database } from "@/lib/types";

export const achievementCategories = ["visits", "harvests", "photos"] as const;
export const achievementMilestones = [1, 5, 10] as const;
export type AchievementCategory = (typeof achievementCategories)[number];

export function participationTotals(db: Pick<Database, "visits" | "journalEntries">, userId: string): Record<AchievementCategory, number> {
  const entries = db.journalEntries.filter((entry) => entry.user_id === userId);
  return {
    // An RSVP is an intention to attend, not a recorded check-in.
    visits: db.visits.filter((visit) => visit.user_id === userId && visit.source === "checkin").length,
    harvests: entries.filter((entry) => entry.stage === "harvest").length,
    photos: entries.reduce((total, entry) => total + entry.image_urls.length, 0),
  };
}
