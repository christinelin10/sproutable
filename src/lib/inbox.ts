import { DateTime } from "luxon";
import type { Activity, Database, User } from "@/lib/types";
import { managesGarden, membershipFor } from "@/lib/permissions";

const WINDOW_DAYS = 60;

export function inboxItems(db: Database, user: User, now = DateTime.now()) {
  const since = now.minus({ days: WINDOW_DAYS }).toISO() ?? "";
  const gardenIds = new Set<string>();
  for (const membership of db.memberships) {
    if (membership.user_id === user.user_id && membership.status === "approved") {
      gardenIds.add(membership.garden_id);
    }
  }
  for (const manager of db.gardenManagers) {
    if (manager.user_id === user.user_id) gardenIds.add(manager.garden_id);
  }

  return db.activityLog
    .filter((item) => item.created_at >= since)
    .filter((item) => {
      if (item.audience_user_id) return item.audience_user_id === user.user_id;
      if (!gardenIds.has(item.garden_id)) return false;
      if (item.visibility === "public") return true;
      return managesGarden(db, user.user_id, item.garden_id) || membershipFor(db, user.user_id, item.garden_id)?.status === "approved";
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function unreadCount(db: Database, user: User, items = inboxItems(db, user)) {
  return items.filter((item) => {
    const seen = db.inboxState.find((row) => row.user_id === user.user_id && row.garden_id === item.garden_id);
    if (!seen) return true;
    return item.created_at > seen.last_seen_at;
  }).length;
}

export function isUnread(db: Database, user: User, item: Activity) {
  const seen = db.inboxState.find((row) => row.user_id === user.user_id && row.garden_id === item.garden_id);
  if (!seen) return true;
  return item.created_at > seen.last_seen_at;
}

export function inboxGroup(iso: string, zone = "America/New_York"): "today" | "week" | "earlier" {
  const date = DateTime.fromISO(iso).setZone(zone);
  const today = DateTime.now().setZone(zone).startOf("day");
  if (date >= today) return "today";
  if (date >= today.minus({ days: 6 })) return "week";
  return "earlier";
}
