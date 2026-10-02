import type { BuddyLink, BuddyNote, Database } from "@/lib/types";

export function linkBetween(links: BuddyLink[], a: string, b: string) {
  return links.find(
    (link) =>
      (link.from_user_id === a && link.to_user_id === b) || (link.from_user_id === b && link.to_user_id === a),
  );
}

export function acceptedBuddyIds(links: BuddyLink[], userId: string) {
  return links
    .filter((link) => link.status === "accepted" && (link.from_user_id === userId || link.to_user_id === userId))
    .map((link) => (link.from_user_id === userId ? link.to_user_id : link.from_user_id));
}

export function notesBetween(notes: BuddyNote[], a: string, b: string) {
  return notes
    .filter(
      (note) =>
        (note.from_user_id === a && note.to_user_id === b) || (note.from_user_id === b && note.to_user_id === a),
    )
    .sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export function peopleNear(db: Database, userId: string) {
  const gardens = new Set<string>();
  for (const tie of db.gardenTies ?? []) if (tie.user_id === userId) gardens.add(tie.garden_id);
  for (const membership of db.memberships) {
    if (membership.user_id === userId && (membership.status === "approved" || membership.status === "pending")) {
      gardens.add(membership.garden_id);
    }
  }
  for (const visit of db.visits) if (visit.user_id === userId) gardens.add(visit.garden_id);
  const ids = new Set<string>();
  const add = (id: string, gardenId: string) => {
    if (id && id !== userId && gardens.has(gardenId)) ids.add(id);
  };
  for (const tie of db.gardenTies ?? []) add(tie.user_id, tie.garden_id);
  for (const membership of db.memberships) {
    if (membership.status === "approved" || membership.status === "pending") add(membership.user_id, membership.garden_id);
  }
  for (const visit of db.visits) add(visit.user_id, visit.garden_id);
  for (const entry of db.journalEntries) add(entry.user_id, entry.garden_id);
  if (ids.size === 0) {
    for (const user of db.users) if (user.user_id !== userId && user.status === "active") ids.add(user.user_id);
  }
  return [...ids]
    .map((id) => db.users.find((user) => user.user_id === id))
    .filter((user) => user && user.status === "active")
    .map((user) => ({ id: user!.user_id, name: user!.name.split(" ")[0] || user!.name }));
}
