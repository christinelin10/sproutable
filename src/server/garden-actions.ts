"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { readDb, updateDb } from "@/lib/data/store";
import { buildRRule, weekdayCode } from "@/lib/events";
import { INVOLVEMENT } from "@/lib/gardens";
import { canSeeMembersContent, gardenBySlug, isApprovedMember, isChatBanned, managesGarden, membershipFor } from "@/lib/permissions";
import { PLATFORM_ADMINS } from "@/lib/demo";
import { saveImage } from "@/lib/uploads";
import type { Activity, Database, GardenEvent, HomeModule, ModuleType, User } from "@/lib/types";

export type ActionState = { error?: string; warning?: string; ok?: boolean } | null;

function now() {
  return new Date().toISOString();
}

function log(db: Database, item: Omit<Activity, "activity_id" | "created_at">) {
  db.activityLog.push({ ...item, activity_id: randomUUID(), created_at: now() });
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

function assertManager(db: Database, user: User, gardenId: string) {
  if (!managesGarden(db, user.user_id, gardenId)) throw new Error("denied");
}

export async function requestJoin(gardenId: string, formData: FormData) {
  const user = await requireUser();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const interests = INVOLVEMENT.filter((option) => formData.get(`inv_${option}`) === "on").join(",");
  let error = "";
  await updateDb((db) => {
    if (managesGarden(db, user.user_id, gardenId)) return;
    const existing = membershipFor(db, user.user_id, gardenId);
    if (existing?.status === "pending" || existing?.status === "approved") return;
    if (existing?.status === "rejected" && existing.decided_at) {
      const decided = DateTime.fromISO(existing.decided_at);
      if (decided.isValid && decided.plus({ days: 7 }) > DateTime.now()) {
        error = "tooSoon";
        return;
      }
    }
    if (existing) {
      existing.status = "pending";
      existing.note = note;
      existing.interests = interests;
      existing.requested_at = now();
      existing.decided_at = "";
      existing.decided_by = "";
      return;
    }
    db.memberships.push({
      membership_id: randomUUID(),
      garden_id: gardenId,
      user_id: user.user_id,
      status: "pending",
      note,
      interests,
      requested_at: now(),
      decided_at: "",
      decided_by: "",
    });
  });
  revalidatePath("/gardens");
  if (error) return { error };
  return { ok: true };
}

export async function decideMembership(gardenId: string, membershipId: string, decision: "approved" | "rejected") {
  const user = await requireUser();
  await updateDb((db) => {
    assertManager(db, user, gardenId);
    const row = db.memberships.find((item) => item.membership_id === membershipId && item.garden_id === gardenId);
    if (!row || row.status !== "pending") return;
    row.status = decision;
    row.decided_at = now();
    row.decided_by = user.user_id;
    const garden = db.gardens.find((item) => item.garden_id === gardenId);
    const name = garden?.name ?? "the garden";
    log(db, {
      garden_id: gardenId,
      type: decision === "approved" ? "membership_approved" : "membership_rejected",
      ref_id: row.membership_id,
      visibility: "public",
      audience_user_id: row.user_id,
      summary_en: decision === "approved" ? `You are now a member of ${name}.` : `Your request to join ${name} was not approved this time.`,
      summary_es: decision === "approved" ? `Ya eres parte de ${name}.` : `Esta vez no se aprobó tu solicitud para unirte a ${name}.`,
    });
  });
  revalidatePath(`/manage/${await slugFor(gardenId)}/members`);
}

async function slugFor(gardenId: string) {
  const db = await readDb();
  return db.gardens.find((garden) => garden.garden_id === gardenId)?.slug ?? "";
}

export async function removeMember(gardenId: string, membershipId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    assertManager(db, user, gardenId);
    const row = db.memberships.find((item) => item.membership_id === membershipId && item.garden_id === gardenId);
    if (!row || row.status !== "approved") return;
    row.status = "removed";
    row.decided_at = now();
    row.decided_by = user.user_id;
    for (const bed of db.beds) {
      if (bed.garden_id === gardenId && bed.assigned_user_id === row.user_id) {
        bed.assigned_user_id = "";
        if (bed.status === "assigned") bed.status = "available";
      }
    }
    const garden = db.gardens.find((item) => item.garden_id === gardenId);
    log(db, {
      garden_id: gardenId,
      type: "membership_removed",
      ref_id: row.membership_id,
      visibility: "public",
      audience_user_id: row.user_id,
      summary_en: `Your membership at ${garden?.name ?? "the garden"} has ended.`,
      summary_es: `Tu membresía en ${garden?.name ?? "el jardín"} terminó.`,
    });
  });
}

export async function restoreChat(gardenId: string, userId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    assertManager(db, user, gardenId);
    for (const ban of db.chatBans) {
      if (ban.garden_id === gardenId && ban.user_id === userId) ban.active = false;
    }
  });
}

const eventSchema = z.object({
  title_en: z.string().trim().min(1).max(140),
  title_es: z.string().trim().max(140).optional().default(""),
  description_en: z.string().trim().min(1).max(4000),
  description_es: z.string().trim().max(4000).optional().default(""),
  category: z.enum(["workday", "workshop", "meal", "meeting", "other"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).optional().default("10:00"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional().default("12:00"),
  all_day: z.boolean().optional().default(false),
  location: z.string().trim().min(1).max(240),
  visibility: z.enum(["public", "members"]),
  capacity: z.number().int().positive().max(500).nullable().optional().default(null),
  repeat: z.enum(["none", "daily", "weekly", "biweekly", "monthly"]),
  weekdays: z.array(z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"])).optional().default([]),
  ends: z.enum(["until", "count"]).optional().default("until"),
  until: z.string().optional().default(""),
  count: z.number().int().min(1).max(60).optional(),
});

export type EventInput = z.infer<typeof eventSchema>;

function applyEvent(target: GardenEvent, input: EventInput) {
  const startTime = input.all_day ? "00:00" : input.start_time;
  const endTime = input.all_day ? "23:59" : input.end_time;
  target.title_en = input.title_en;
  target.title_es = input.title_es ?? "";
  target.description_en = input.description_en;
  target.description_es = input.description_es ?? "";
  target.category = input.category;
  target.location = input.location;
  target.start_datetime = `${input.date}T${startTime}:00`;
  target.end_datetime = `${input.date}T${endTime}:00`;
  target.all_day = Boolean(input.all_day);
  target.visibility = input.visibility;
  target.capacity = input.capacity ?? null;
  target.recurrence_rule = buildRRule({
    repeat: input.repeat,
    weekdays: input.weekdays?.length ? input.weekdays : [weekdayCode(input.date)],
    ends: input.ends,
    count: input.count,
  });
  target.recurrence_until = input.repeat !== "none" && input.ends !== "count" ? input.until || "" : "";
}

export async function saveEvent(slug: string, raw: EventInput, eventId?: string): Promise<ActionState> {
  const parsed = eventSchema.safeParse(raw);
  if (!parsed.success) return { error: "required" };
  const input = parsed.data;
  if (!input.all_day && input.end_time <= input.start_time) return { error: "required" };
  if (input.repeat !== "none" && input.ends !== "count" && input.until && input.until < input.date) return { error: "required" };
  const user = await requireUser();
  const past = input.date < DateTime.now().setZone("America/New_York").toISODate()!;
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) throw new Error("missing");
    assertManager(db, user, garden.garden_id);
    if (eventId) {
      const existing = db.events.find((event) => event.event_id === eventId && event.garden_id === garden.garden_id);
      if (!existing) throw new Error("missing");
      applyEvent(existing, input);
      return;
    }
    const event: GardenEvent = {
      event_id: randomUUID(),
      garden_id: garden.garden_id,
      title_en: "",
      title_es: "",
      description_en: "",
      description_es: "",
      category: input.category,
      location: input.location,
      start_datetime: "",
      end_datetime: "",
      all_day: false,
      visibility: input.visibility,
      capacity: null,
      recurrence_rule: "",
      recurrence_until: "",
      status: "active",
      created_by: user.user_id,
      created_at: now(),
    };
    applyEvent(event, input);
    db.events.push(event);
    log(db, {
      garden_id: garden.garden_id,
      type: "event_created",
      ref_id: event.event_id,
      visibility: event.visibility,
      audience_user_id: "",
      summary_en: `${event.title_en} was added.`,
      summary_es: `Se agregó ${event.title_es || event.title_en}.`,
    });
  });
  revalidatePath(`/gardens/${slug}/events`);
  redirect(`/gardens/${slug}/events?notice=${past ? "past" : "saved"}`);
}

export async function cancelOccurrence(slug: string, eventId: string, date: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) throw new Error("missing");
    assertManager(db, user, garden.garden_id);
    const event = db.events.find((item) => item.event_id === eventId && item.garden_id === garden.garden_id);
    if (!event) return;
    if (!db.eventExceptions.some((row) => row.event_id === eventId && row.occurrence_date === date)) {
      db.eventExceptions.push({ exception_id: randomUUID(), event_id: eventId, occurrence_date: date, action: "cancelled" });
    }
    log(db, {
      garden_id: garden.garden_id,
      type: "event_cancelled",
      ref_id: eventId,
      visibility: event.visibility,
      audience_user_id: "",
      summary_en: `${event.title_en} on ${date} was cancelled.`,
      summary_es: `Se canceló ${event.title_es || event.title_en} el ${date}.`,
    });
  });
  revalidatePath(`/gardens/${slug}/events`);
}

export async function cancelSeries(slug: string, eventId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const event = db.events.find((item) => item.event_id === eventId);
    if (!event) return;
    event.status = "cancelled";
    log(db, {
      garden_id: garden.garden_id,
      type: "event_cancelled",
      ref_id: eventId,
      visibility: event.visibility,
      audience_user_id: "",
      summary_en: `${event.title_en} was cancelled.`,
      summary_es: `Se canceló ${event.title_es || event.title_en}.`,
    });
  });
  revalidatePath(`/gardens/${slug}/events`);
}

export async function rsvpToEvent(input: {
  slug: string;
  eventId: string;
  date: string;
  name: string;
  email: string;
  partySize: number;
  volunteer: boolean;
  note: string;
  cancel?: boolean;
}): Promise<ActionState> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!z.string().email().safeParse(email).success || name.length < 2) return { error: "email" };
  const partySize = Math.min(10, Math.max(1, Math.floor(input.partySize || 1)));
  const session = await getCurrentUser();
  let error = "";
  await updateDb((db) => {
    const garden = gardenBySlug(db, input.slug);
    const event = db.events.find((item) => item.event_id === input.eventId && item.garden_id === garden?.garden_id);
    if (!garden || !event || event.status === "cancelled") {
      error = "generic";
      return;
    }
    const member = session ? canSeeMembersContent(db, session.user_id, garden.garden_id) : false;
    if (event.visibility === "members" && !member) {
      error = "denied";
      return;
    }
    const existing = db.rsvps.find(
      (row) => row.event_id === event.event_id && row.occurrence_date === input.date && row.email.toLowerCase() === email,
    );
    if (input.cancel) {
      if (existing) existing.status = "cancelled";
      return;
    }
    const others = db.rsvps.filter(
      (row) =>
        row.event_id === event.event_id &&
        row.occurrence_date === input.date &&
        row.status === "going" &&
        row.email.toLowerCase() !== email,
    );
    const used = others.reduce((sum, row) => sum + row.party_size, 0);
    if (event.capacity && used + partySize > event.capacity) {
      error = "full";
      return;
    }
    if (existing) {
      existing.name = name;
      existing.party_size = partySize;
      existing.volunteer = input.volunteer;
      existing.note = input.note.slice(0, 400);
      existing.status = "going";
      existing.user_id = session?.user_id ?? existing.user_id;
    } else {
      db.rsvps.push({
        rsvp_id: randomUUID(),
        event_id: event.event_id,
        occurrence_date: input.date,
        user_id: session?.user_id ?? "",
        name,
        email,
        party_size: partySize,
        volunteer: input.volunteer,
        note: input.note.slice(0, 400),
        status: "going",
        created_at: now(),
      });
    }
    if (session && !db.visits.some((visit) => visit.user_id === session.user_id && visit.source === "rsvp" && visit.visited_at.startsWith(input.date) && visit.garden_id === garden.garden_id)) {
      db.visits.push({
        visit_id: randomUUID(),
        garden_id: garden.garden_id,
        user_id: session.user_id,
        visited_at: `${input.date}T12:00:00.000Z`,
        source: "rsvp",
      });
    }
  });
  revalidatePath(`/gardens/${input.slug}/events`);
  if (error) return { error };
  return { ok: true };
}

export async function checkIn(slug: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    if (!canSeeMembersContent(db, user.user_id, garden.garden_id)) throw new Error("denied");
    const day = DateTime.now().setZone(garden.timezone).toISODate();
    const already = db.visits.some((visit) => {
      if (visit.user_id !== user.user_id || visit.garden_id !== garden.garden_id || visit.source !== "checkin") return false;
      return DateTime.fromISO(visit.visited_at).setZone(garden.timezone).toISODate() === day;
    });
    if (already) return;
    db.visits.push({
      visit_id: randomUUID(),
      garden_id: garden.garden_id,
      user_id: user.user_id,
      visited_at: now(),
      source: "checkin",
    });
  });
  revalidatePath(`/gardens/${slug}`);
}

export async function markInboxRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await updateDb((db) => {
    const gardenIds = new Set<string>();
    for (const membership of db.memberships) {
      if (membership.user_id === user.user_id) gardenIds.add(membership.garden_id);
    }
    for (const manager of db.gardenManagers) {
      if (manager.user_id === user.user_id) gardenIds.add(manager.garden_id);
    }
    const stamp = now();
    for (const gardenId of gardenIds) {
      const row = db.inboxState.find((item) => item.user_id === user.user_id && item.garden_id === gardenId);
      if (row) row.last_seen_at = stamp;
      else db.inboxState.push({ user_id: user.user_id, garden_id: gardenId, last_seen_at: stamp });
    }
  });
  revalidatePath("/inbox");
}

const moduleTypes: ModuleType[] = ["about", "gallery", "upcoming_events", "ways", "tools", "getting_here", "announcements", "contact"];

export async function addModule(slug: string, type: ModuleType) {
  const user = await requireUser();
  if (!moduleTypes.includes(type) && type !== "hero") return;
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const modules = db.homeModules.filter((item) => item.garden_id === garden.garden_id);
    const position = modules.reduce((max, item) => Math.max(max, item.position), -1) + 1;
    db.homeModules.push({
      module_id: randomUUID(),
      garden_id: garden.garden_id,
      type,
      position,
      visible: true,
      title_en: "",
      title_es: "",
      body_en: "",
      body_es: "",
      config: type === "gallery" ? { images: [] } : type === "tools" ? { items: [] } : {},
    });
  });
  revalidatePath(`/manage/${slug}/page-builder`);
}

export async function moveModule(slug: string, moduleId: string, direction: "up" | "down") {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const modules = db.homeModules.filter((item) => item.garden_id === garden.garden_id).sort((a, b) => a.position - b.position);
    const index = modules.findIndex((item) => item.module_id === moduleId);
    const swap = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swap < 0 || swap >= modules.length) return;
    const current = modules[index].position;
    modules[index].position = modules[swap].position;
    modules[swap].position = current;
  });
  revalidatePath(`/gardens/${slug}`);
  revalidatePath(`/manage/${slug}/page-builder`);
}

export async function toggleModule(slug: string, moduleId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const row = db.homeModules.find((item) => item.module_id === moduleId);
    if (row) row.visible = !row.visible;
  });
  revalidatePath(`/gardens/${slug}`);
}

export async function deleteModule(slug: string, moduleId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const row = db.homeModules.find((item) => item.module_id === moduleId);
    if (!row || row.type === "hero") return;
    db.homeModules = db.homeModules.filter((item) => item.module_id !== moduleId);
  });
  revalidatePath(`/gardens/${slug}`);
}

export async function saveModule(slug: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const moduleId = String(formData.get("module_id") ?? "");
  try {
    await updateDb(async (db) => {
      const garden = gardenBySlug(db, slug);
      if (!garden) throw new Error("missing");
      assertManager(db, user, garden.garden_id);
      const row = db.homeModules.find((item) => item.module_id === moduleId && item.garden_id === garden.garden_id);
      if (!row) return;
      row.title_en = String(formData.get("title_en") ?? "").slice(0, 160);
      row.title_es = String(formData.get("title_es") ?? "").slice(0, 160);
      row.body_en = String(formData.get("body_en") ?? "").slice(0, 8000);
      row.body_es = String(formData.get("body_es") ?? "").slice(0, 8000);
      if (row.type === "hero") {
        const file = formData.get("cover");
        if (file instanceof File && file.size > 0) garden.cover_image_url = await saveImage(file);
      }
      if (row.type === "gallery") {
        const images = Array.isArray(row.config.images) ? [...(row.config.images as object[])] : [];
        const altEn = String(formData.get("alt_en") ?? "Garden photo");
        const altEs = String(formData.get("alt_es") ?? "");
        const captionEn = String(formData.get("caption_en") ?? "");
        const captionEs = String(formData.get("caption_es") ?? "");
        for (const file of formData.getAll("photos")) {
          if (file instanceof File && file.size > 0) {
            images.push({ url: await saveImage(file), alt_en: altEn, alt_es: altEs, caption_en: captionEn, caption_es: captionEs });
          }
        }
        const remove = new Set(formData.getAll("remove").map(String));
        row.config = { images: images.filter((image) => !remove.has(String((image as { url?: string }).url))) };
      }
      if (row.type === "tools") {
        const items = [];
        for (let i = 0; i < 8; i += 1) {
          const nameEn = String(formData.get(`tool_name_en_${i}`) ?? "").trim();
          const nameEs = String(formData.get(`tool_name_es_${i}`) ?? "").trim();
          if (!nameEn && !nameEs) continue;
          items.push({
            name_en: nameEn,
            name_es: nameEs,
            note_en: String(formData.get(`tool_note_en_${i}`) ?? ""),
            note_es: String(formData.get(`tool_note_es_${i}`) ?? ""),
          });
        }
        row.config = { items };
      }
      if (row.type === "getting_here") {
        row.config = {
          bus_en: String(formData.get("bus_en") ?? ""),
          bus_es: String(formData.get("bus_es") ?? ""),
          parking_en: String(formData.get("parking_en") ?? ""),
          parking_es: String(formData.get("parking_es") ?? ""),
          access_en: String(formData.get("access_en") ?? ""),
          access_es: String(formData.get("access_es") ?? ""),
        };
      }
      if (row.type === "ways") {
        row.config = { options: INVOLVEMENT.filter((option) => formData.get(`inv_${option}`) === "on") };
      }
      if (row.type === "contact") {
        row.config = {
          instagram: String(formData.get("instagram") ?? ""),
          facebook: String(formData.get("facebook") ?? ""),
        };
      }
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "type" || error.message === "size")) return { error: "size" };
    throw error;
  }
  revalidatePath(`/gardens/${slug}`);
  redirect(`/manage/${slug}/page-builder?notice=saved`);
}

export async function saveAnnouncement(slug: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const titleEn = String(formData.get("title_en") ?? "").trim();
  const bodyEn = String(formData.get("body_en") ?? "").trim();
  if (!titleEn || !bodyEn) return { error: "required" };
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const announcement = {
      announcement_id: randomUUID(),
      garden_id: garden.garden_id,
      title_en: titleEn,
      title_es: String(formData.get("title_es") ?? "").trim(),
      body_en: bodyEn,
      body_es: String(formData.get("body_es") ?? "").trim(),
      visibility: formData.get("visibility") === "members" ? "members" as const : "public" as const,
      pinned: formData.get("pinned") === "on",
      created_by: user.user_id,
      created_at: now(),
    };
    db.announcements.push(announcement);
    log(db, {
      garden_id: garden.garden_id,
      type: "announcement",
      ref_id: announcement.announcement_id,
      visibility: announcement.visibility,
      audience_user_id: "",
      summary_en: `New announcement: ${titleEn}`,
      summary_es: `Nuevo aviso: ${announcement.title_es || titleEn}`,
    });
  });
  revalidatePath(`/gardens/${slug}`);
  redirect(`/manage/${slug}/announcements?notice=saved`);
}

export async function saveGardenSettings(slug: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    garden.name = String(formData.get("name") ?? garden.name).trim() || garden.name;
    garden.address = String(formData.get("address") ?? "");
    garden.neighborhood = String(formData.get("neighborhood") ?? "");
    garden.description_en = String(formData.get("description_en") ?? "");
    garden.description_es = String(formData.get("description_es") ?? "");
    garden.contact_email = String(formData.get("contact_email") ?? "");
    garden.contact_phone = String(formData.get("contact_phone") ?? "");
    garden.year_founded = String(formData.get("year_founded") ?? "");
    garden.bed_count = String(formData.get("bed_count") ?? "");
    if (PLATFORM_ADMINS.has(user.email)) garden.verified = formData.get("verified") === "on";
  });
  revalidatePath(`/gardens/${slug}`);
  redirect(`/manage/${slug}/settings?notice=saved`);
}

export async function createBed(slug: string, formData: FormData) {
  const user = await requireUser();
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return;
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    db.beds.push({
      bed_id: randomUUID(),
      garden_id: garden.garden_id,
      label,
      size: String(formData.get("size") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      status: "available",
      assigned_user_id: "",
      season: String(DateTime.now().year),
    });
  });
  revalidatePath(`/manage/${slug}/beds`);
}

export async function assignBed(slug: string, bedId: string, formData: FormData) {
  const user = await requireUser();
  const assigned = String(formData.get("assigned_user_id") ?? "");
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const bed = db.beds.find((item) => item.bed_id === bedId && item.garden_id === garden.garden_id);
    if (!bed) return;
    if (!assigned) {
      bed.assigned_user_id = "";
      if (bed.status === "assigned") bed.status = "available";
      return;
    }
    if (!isApprovedMember(db, assigned, garden.garden_id)) return;
    bed.assigned_user_id = assigned;
    bed.status = "assigned";
  });
  revalidatePath(`/gardens/${slug}/beds`);
}

export async function saveJournal(slug: string, bedId: string, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const stage = String(formData.get("stage") ?? "growing");
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "required" };
  if (!["planted", "growing", "maintenance", "harvest"].includes(stage)) return { error: "required" };
  try {
    await updateDb(async (db) => {
      const garden = gardenBySlug(db, slug);
      const bed = db.beds.find((item) => item.bed_id === bedId && item.garden_id === garden?.garden_id);
      if (!garden || !bed) throw new Error("missing");
      const manager = managesGarden(db, user.user_id, garden.garden_id);
      if (bed.assigned_user_id !== user.user_id) throw new Error("denied");
      if (manager && bed.assigned_user_id !== user.user_id) throw new Error("denied");
      const images: string[] = [];
      for (const file of formData.getAll("photos").slice(0, 5)) {
        if (file instanceof File && file.size > 0) images.push(await saveImage(file));
      }
      const amountRaw = String(formData.get("harvest_amount") ?? "");
      db.journalEntries.push({
        entry_id: randomUUID(),
        bed_id: bed.bed_id,
        garden_id: garden.garden_id,
        user_id: user.user_id,
        entry_date: String(formData.get("entry_date") ?? "") || DateTime.now().setZone(garden.timezone).toISODate()!,
        stage: stage as "planted",
        crop: String(formData.get("crop") ?? "").slice(0, 80),
        text: text.slice(0, 2000),
        image_urls: images,
        harvest_amount: stage === "harvest" && amountRaw ? Number(amountRaw) : null,
        harvest_unit: stage === "harvest" && formData.get("harvest_unit") === "kg" ? "kg" : stage === "harvest" ? "lb" : "",
        created_at: now(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "denied") return { error: "denied" };
    if (error instanceof Error && (error.message === "type" || error.message === "size")) return { error: "size" };
    throw error;
  }
  revalidatePath(`/gardens/${slug}/beds/${bedId}`);
  redirect(`/gardens/${slug}/beds/${bedId}?notice=saved`);
}

export async function deleteJournal(slug: string, entryId: string) {
  const user = await requireUser();
  await updateDb((db) => {
    const entry = db.journalEntries.find((item) => item.entry_id === entryId);
    if (!entry || entry.user_id !== user.user_id) throw new Error("denied");
    db.journalEntries = db.journalEntries.filter((item) => item.entry_id !== entryId);
  });
  revalidatePath(`/gardens/${slug}/beds`);
}

export async function postChat(slug: string, body: string) {
  const user = await requireUser();
  const text = body.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!text) return { error: "empty" };
  let error = "";
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    if (isChatBanned(db, user.user_id, garden.garden_id)) {
      error = "banned";
      return;
    }
    const last = [...db.chatMessages].reverse().find((message) => message.user_id === user.user_id && message.garden_id === garden.garden_id);
    if (last && Date.now() - Date.parse(last.created_at) < 1000) {
      error = "rate";
      return;
    }
    db.chatMessages.push({
      message_id: randomUUID(),
      garden_id: garden.garden_id,
      user_id: user.user_id,
      body: text,
      created_at: now(),
      deleted: false,
      deleted_by: "",
    });
  });
  if (error) return { error };
  return { ok: true };
}

export async function moderateChat(slug: string, messageId: string, action: "delete" | "ban") {
  const user = await requireUser();
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden) return;
    assertManager(db, user, garden.garden_id);
    const message = db.chatMessages.find((item) => item.message_id === messageId && item.garden_id === garden.garden_id);
    if (!message) return;
    if (action === "delete") {
      message.deleted = true;
      message.deleted_by = user.user_id;
      return;
    }
    const existing = db.chatBans.find((ban) => ban.garden_id === garden.garden_id && ban.user_id === message.user_id);
    if (existing) {
      existing.active = true;
      existing.banned_by = user.user_id;
      existing.created_at = now();
    } else {
      db.chatBans.push({
        garden_id: garden.garden_id,
        user_id: message.user_id,
        banned_by: user.user_id,
        reason: "",
        created_at: now(),
        active: true,
      });
    }
  });
}
