import { DateTime } from "luxon";
import { RRule } from "rrule";
import type { EventException, GardenEvent } from "@/lib/types";

export interface Occurrence {
  eventId: string;
  date: string;
  start: string;
  end: string;
  cancelled: boolean;
  event: GardenEvent;
}

function wallTime(value: string, zone: string) {
  return DateTime.fromISO(value, { zone });
}

function asFloatingUtc(dt: DateTime) {
  return new Date(Date.UTC(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, 0));
}

function fromFloatingUtc(date: Date, zone: string) {
  return DateTime.fromObject(
    {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
    },
    { zone },
  );
}

export function expandEvents(
  events: GardenEvent[],
  exceptions: EventException[],
  zone: string,
  windowStart: DateTime,
  windowEnd: DateTime,
): Occurrence[] {
  const occurrences: Occurrence[] = [];

  for (const event of events) {
    const start = wallTime(event.start_datetime, zone);
    const end = wallTime(event.end_datetime, zone);
    if (!start.isValid || !end.isValid) continue;
    const duration = end.diff(start);
    const cancelledDates = new Set(
      exceptions
        .filter((row) => row.event_id === event.event_id && row.action === "cancelled")
        .map((row) => row.occurrence_date),
    );

    const dates: DateTime[] = [];
    if (!event.recurrence_rule) {
      dates.push(start);
    } else {
      const options = RRule.parseString(event.recurrence_rule);
      let until = options.until;
      if (!until && !options.count && event.recurrence_until) {
        until = asFloatingUtc(wallTime(event.recurrence_until, zone).endOf("day"));
      }
      if (!until && !options.count) until = asFloatingUtc(windowEnd.endOf("day"));
      const rule = new RRule({
        ...options,
        dtstart: asFloatingUtc(start),
        until,
      });
      const matches = rule.between(asFloatingUtc(windowStart.startOf("day")), asFloatingUtc(windowEnd.endOf("day")), true);
      for (const match of matches) dates.push(fromFloatingUtc(match, zone));
    }

    for (const date of dates) {
      if (date < windowStart.startOf("day") || date > windowEnd.endOf("day")) continue;
      const key = date.toISODate();
      if (!key) continue;
      occurrences.push({
        eventId: event.event_id,
        date: key,
        start: date.toISO() ?? date.toFormat("yyyy-MM-dd'T'HH:mm:ss"),
        end: date.plus(duration).toISO() ?? "",
        cancelled: event.status === "cancelled" || cancelledDates.has(key),
        event,
      });
    }
  }

  return occurrences.sort((a, b) => a.start.localeCompare(b.start));
}

export function nextPublicOccurrence(
  events: GardenEvent[],
  exceptions: EventException[],
  zone: string,
  from = DateTime.now().setZone(zone),
) {
  const upcoming = expandEvents(
    events.filter((event) => event.visibility === "public" && event.status === "active"),
    exceptions,
    zone,
    from.startOf("day"),
    from.plus({ months: 3 }),
  ).filter((item) => !item.cancelled && item.start >= (from.toISO() ?? ""));
  return upcoming[0] ?? null;
}

export function weekdayCode(date: string): "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU" {
  const day = DateTime.fromISO(date).weekday;
  return (["MO", "TU", "WE", "TH", "FR", "SA", "SU"] as const)[day - 1];
}

export function buildRRule(input: {
  repeat: "none" | "daily" | "weekly" | "biweekly" | "monthly";
  weekdays: string[];
  ends?: "until" | "count";
  count?: number;
}) {
  if (input.repeat === "none") return "";
  if (input.repeat === "daily") {
    return input.ends === "count" && input.count ? `FREQ=DAILY;COUNT=${input.count}` : "FREQ=DAILY";
  }
  if (input.repeat === "monthly") {
    return input.ends === "count" && input.count ? `FREQ=MONTHLY;COUNT=${input.count}` : "FREQ=MONTHLY";
  }
  const days = input.weekdays.length ? input.weekdays.join(",") : "SA";
  const interval = input.repeat === "biweekly" ? ";INTERVAL=2" : "";
  const count = input.ends === "count" && input.count ? `;COUNT=${input.count}` : "";
  return `FREQ=WEEKLY${interval};BYDAY=${days}${count}`;
}
