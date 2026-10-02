import type { Database } from "@/lib/types";

export const xpAwards = {
  visit: 20,
  rsvp: 10,
  journal: 15,
  photo: 10,
  harvest: 25,
} as const;

export const levels = [
  { level: 1, minXp: 0, id: "sprout" },
  { level: 2, minXp: 40, id: "visitor" },
  { level: 3, minXp: 120, id: "helper" },
  { level: 4, minXp: 280, id: "gardener" },
  { level: 5, minXp: 500, id: "steward" },
] as const;

export type LevelId = (typeof levels)[number]["id"];

export type Progress = {
  xp: number;
  visits: number;
  gardensVisited: number;
  rsvps: number;
  journals: number;
  photos: number;
  harvests: number;
  level: number;
  levelId: LevelId;
  nextLevelXp: number | null;
  intoLevel: number;
  span: number;
};

export function progressFor(db: Pick<Database, "visits" | "rsvps" | "journalEntries">, userId: string): Progress {
  const visits = db.visits.filter((visit) => visit.user_id === userId && visit.source === "checkin");
  const gardensVisited = new Set(visits.map((visit) => visit.garden_id)).size;
  const rsvps = db.rsvps.filter((rsvp) => rsvp.user_id === userId && rsvp.status === "going").length;
  const entries = db.journalEntries.filter((entry) => entry.user_id === userId);
  const photos = entries.reduce((total, entry) => total + entry.image_urls.length, 0);
  const harvests = entries.filter((entry) => entry.stage === "harvest").length;
  const xp =
    visits.length * xpAwards.visit +
    rsvps * xpAwards.rsvp +
    entries.length * xpAwards.journal +
    photos * xpAwards.photo +
    harvests * xpAwards.harvest;

  let current: (typeof levels)[number] = levels[0];
  for (const level of levels) {
    if (xp >= level.minXp) current = level;
  }
  const next = levels.find((level) => level.minXp > xp) ?? null;
  const span = next ? next.minXp - current.minXp : 0;
  return {
    xp,
    visits: visits.length,
    gardensVisited,
    rsvps,
    journals: entries.length,
    photos,
    harvests,
    level: current.level,
    levelId: current.id,
    nextLevelXp: next?.minXp ?? null,
    intoLevel: xp - current.minXp,
    span,
  };
}

export const badgeIds = [
  "firstSprout",
  "explorer",
  "helpingHands",
  "harvestHelper",
  "gardenStory",
  "snapshot",
  "returnVisit",
  "gardenBuddy",
  "seasonFriend",
  "toolShare",
] as const;

export type BadgeId = (typeof badgeIds)[number];

export function emptyBadges(): Record<BadgeId, boolean> {
  return {
    firstSprout: false,
    explorer: false,
    helpingHands: false,
    harvestHelper: false,
    gardenStory: false,
    snapshot: false,
    returnVisit: false,
    gardenBuddy: false,
    seasonFriend: false,
    toolShare: false,
  };
}

export function badgeState(db: Database, userId: string): Record<BadgeId, boolean> {
  const visits = db.visits.filter((visit) => visit.user_id === userId && visit.source === "checkin");
  const gardenCounts = new Map<string, number>();
  for (const visit of visits) gardenCounts.set(visit.garden_id, (gardenCounts.get(visit.garden_id) ?? 0) + 1);
  const rsvps = db.rsvps.filter((rsvp) => rsvp.user_id === userId && rsvp.status === "going");
  const entries = db.journalEntries.filter((entry) => entry.user_id === userId);
  const helping = rsvps.some((rsvp) => {
    if (rsvp.volunteer) return true;
    return db.events.find((event) => event.event_id === rsvp.event_id)?.category === "workday";
  });
  const buddy = rsvps.some((rsvp) => {
    if (rsvp.party_size > 1) return true;
    return db.rsvps.some(
      (other) =>
        other.rsvp_id !== rsvp.rsvp_id &&
        other.event_id === rsvp.event_id &&
        other.occurrence_date === rsvp.occurrence_date &&
        other.status === "going" &&
        other.user_id !== userId,
    );
  });

  return {
    firstSprout: visits.length >= 1,
    explorer: gardenCounts.size >= 3,
    helpingHands: helping,
    harvestHelper: entries.some((entry) => entry.stage === "harvest"),
    gardenStory: entries.length >= 1,
    snapshot: entries.some((entry) => entry.image_urls.length > 0),
    returnVisit: [...gardenCounts.values()].some((count) => count >= 2),
    gardenBuddy: buddy,
    seasonFriend: (db.moneyDonations ?? []).some((donation) => donation.user_id === userId),
    toolShare: (db.itemDonations ?? []).some((donation) => donation.offered_by === userId),
  };
}
