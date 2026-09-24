import { DateTime } from "luxon";
import type { Language } from "@/lib/types";

export function formatDateTime(iso: string, locale: Language, zone = "America/New_York") {
  const date = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  const value = date.isValid ? date : DateTime.fromISO(iso, { zone });
  return value.setLocale(locale).toLocaleString(DateTime.DATETIME_MED);
}

export function formatDate(iso: string, locale: Language, zone = "America/New_York") {
  const date = DateTime.fromISO(iso, { zone });
  return date.setLocale(locale).toLocaleString(DateTime.DATE_MED);
}

export function formatTime(iso: string, locale: Language, zone = "America/New_York") {
  const date = DateTime.fromISO(iso, { setZone: true }).setZone(zone);
  const value = date.isValid ? date : DateTime.fromISO(iso, { zone });
  return value.setLocale(locale).toLocaleString(DateTime.TIME_SIMPLE);
}
