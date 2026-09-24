import type { Database, Membership } from "@/lib/types";

export function gardenBySlug(db: Database, slug: string) {
  return db.gardens.find((garden) => garden.slug === slug) ?? null;
}

export function managesGarden(db: Database, userId: string, gardenId: string) {
  return db.gardenManagers.some((row) => row.user_id === userId && row.garden_id === gardenId);
}

export function membershipFor(db: Database, userId: string, gardenId: string): Membership | null {
  return db.memberships.find((row) => row.user_id === userId && row.garden_id === gardenId) ?? null;
}

export function isApprovedMember(db: Database, userId: string, gardenId: string) {
  return membershipFor(db, userId, gardenId)?.status === "approved";
}

export function canSeeMembersContent(db: Database, userId: string | null, gardenId: string) {
  if (!userId) return false;
  return managesGarden(db, userId, gardenId) || isApprovedMember(db, userId, gardenId);
}

export function isChatBanned(db: Database, userId: string, gardenId: string) {
  return db.chatBans.some((ban) => ban.garden_id === gardenId && ban.user_id === userId && ban.active);
}

export function userByEmail(db: Database, email: string) {
  const needle = email.trim().toLowerCase();
  return db.users.find((user) => user.email.toLowerCase() === needle && user.status === "active") ?? null;
}

export function userById(db: Database, userId: string) {
  return db.users.find((user) => user.user_id === userId) ?? null;
}
