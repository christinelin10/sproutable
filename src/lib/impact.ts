import { DateTime } from "luxon";
import type { Database } from "@/lib/types";

export type PeriodKey = "month" | "season" | "year" | "custom";

export function periodRange(key: PeriodKey, zone: string, customFrom?: string, customTo?: string) {
  const now = DateTime.now().setZone(zone);
  if (key === "month") return { from: now.startOf("month"), to: now.endOf("month"), label: "month" };
  if (key === "year") return { from: now.minus({ months: 11 }).startOf("month"), to: now.endOf("month"), label: "year" };
  if (key === "custom" && customFrom && customTo) {
    return {
      from: DateTime.fromISO(customFrom, { zone }).startOf("day"),
      to: DateTime.fromISO(customTo, { zone }).endOf("day"),
      label: "custom",
    };
  }
  const startYear = now.month < 4 ? now.year - 1 : now.year;
  return {
    from: DateTime.fromObject({ year: startYear, month: 4, day: 1 }, { zone }),
    to: DateTime.fromObject({ year: startYear, month: 10, day: 31 }, { zone }).endOf("day"),
    label: "season",
  };
}

export function impactSummary(db: Database, gardenId: string, from: DateTime, to: DateTime) {
  const fromIso = from.toISO() ?? "";
  const toIso = to.toISO() ?? "";
  const inRange = (iso: string) => iso >= fromIso && iso <= toIso;

  const checkins = db.visits.filter((visit) => visit.garden_id === gardenId && visit.source === "checkin" && inRange(visit.visited_at));
  const rsvpVisits = db.visits.filter((visit) => visit.garden_id === gardenId && visit.source === "rsvp" && inRange(visit.visited_at));
  const events = db.events.filter((event) => event.garden_id === gardenId && event.status === "active" && inRange(event.start_datetime));
  const rsvps = db.rsvps.filter((rsvp) => {
    const event = db.events.find((item) => item.event_id === rsvp.event_id);
    return event?.garden_id === gardenId && rsvp.status === "going" && inRange(`${rsvp.occurrence_date}T12:00:00`);
  });
  const members = db.memberships.filter((row) => row.garden_id === gardenId && row.status === "approved");
  const harvest = db.journalEntries.filter(
    (entry) => entry.garden_id === gardenId && entry.stage === "harvest" && entry.harvest_amount && inRange(entry.entry_date),
  );
  const harvestLb = harvest.reduce((sum, entry) => {
    const amount = entry.harvest_amount ?? 0;
    return sum + (entry.harvest_unit === "kg" ? amount * 2.20462 : amount);
  }, 0);

  const months: string[] = [];
  let cursor = from.startOf("month");
  while (cursor <= to) {
    months.push(cursor.toFormat("yyyy-MM"));
    cursor = cursor.plus({ months: 1 });
  }

  const visitsByMonth = months.map((month) => ({
    month,
    visits:
      checkins.filter((visit) => visit.visited_at.startsWith(month)).length +
      rsvpVisits.filter((visit) => visit.visited_at.startsWith(month)).length,
  }));

  const harvestByMonth = months.map((month) => ({
    month,
    pounds: Number(
      harvest
        .filter((entry) => entry.entry_date.startsWith(month))
        .reduce((sum, entry) => sum + (entry.harvest_unit === "kg" ? (entry.harvest_amount ?? 0) * 2.20462 : entry.harvest_amount ?? 0), 0)
        .toFixed(1),
    ),
  }));

  const categories = ["workday", "workshop", "meal", "meeting", "other"] as const;
  const eventsByCategory = categories.map((category) => ({
    category,
    count: events.filter((event) => event.category === category).length,
  }));

  const membersByMonth = months.map((month) => ({
    month,
    count: db.memberships.filter(
      (row) => row.garden_id === gardenId && row.status === "approved" && (row.decided_at || row.requested_at).startsWith(month),
    ).length,
  }));

  return {
    visits: checkins.length + rsvpVisits.length,
    eventsHeld: events.length,
    rsvpCount: rsvps.reduce((sum, row) => sum + row.party_size, 0),
    activeMembers: members.length,
    harvestLb: Number(harvestLb.toFixed(1)),
    visitsByMonth,
    harvestByMonth,
    eventsByCategory,
    membersByMonth,
    visitRows: [...checkins, ...rsvpVisits],
    harvestRows: harvest,
  };
}
