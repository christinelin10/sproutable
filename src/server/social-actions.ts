"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isManagerAward } from "@/lib/awards";
import { linkBetween } from "@/lib/buddies";
import { updateDb } from "@/lib/data/store";
import { gardenBySlug, managesGarden } from "@/lib/permissions";
import type { GardenTieKind } from "@/lib/types";

function now() {
  return new Date().toISOString();
}

function safeNext(value: string, fallback: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.includes("://")) return fallback;
  return value;
}

export async function setGardenTie(formData: FormData) {
  const user = await getCurrentUser();
  const gardenId = String(formData.get("garden_id") ?? "");
  const next = String(formData.get("next") ?? "/gardens");
  const requested = String(formData.get("kind") ?? "");
  const kind: GardenTieKind = requested === "gardener" || requested === "volunteer" ? requested : "favorite";
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext(next, "/gardens"))}`);
  await updateDb((db) => {
    if (!db.gardenTies) db.gardenTies = [];
    const existing = db.gardenTies.find((tie) => tie.user_id === user.user_id && tie.garden_id === gardenId && tie.kind === kind);
    if (existing) {
      db.gardenTies = db.gardenTies.filter((tie) => tie.tie_id !== existing.tie_id);
      return;
    }
    if (!db.gardens.some((garden) => garden.garden_id === gardenId)) return;
    db.gardenTies.push({
      tie_id: randomUUID(),
      garden_id: gardenId,
      user_id: user.user_id,
      kind,
      created_at: now(),
    });
  });
  revalidatePath("/", "layout");
}

export async function inviteBuddy(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/buddies");
  const otherId = String(formData.get("user_id") ?? "");
  if (!otherId || otherId === user.user_id) return;
  await updateDb((db) => {
    if (!db.buddyLinks) db.buddyLinks = [];
    if (!db.users.some((person) => person.user_id === otherId)) return;
    const existing = linkBetween(db.buddyLinks, user.user_id, otherId);
    if (!existing) {
      db.buddyLinks.push({
        buddy_id: randomUUID(),
        from_user_id: user.user_id,
        to_user_id: otherId,
        status: "pending",
        created_at: now(),
      });
      return;
    }
    if (existing.status === "pending" && existing.from_user_id === otherId) existing.status = "accepted";
  });
  revalidatePath("/buddies");
  revalidatePath("/community");
}

export async function respondBuddy(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/buddies");
  const buddyId = String(formData.get("buddy_id") ?? "");
  const accept = formData.get("decision") === "accept";
  await updateDb((db) => {
    if (!db.buddyLinks) db.buddyLinks = [];
    const link = db.buddyLinks.find((item) => item.buddy_id === buddyId && item.to_user_id === user.user_id && item.status === "pending");
    if (!link) return;
    if (accept) link.status = "accepted";
    else db.buddyLinks = db.buddyLinks.filter((item) => item.buddy_id !== buddyId);
  });
  revalidatePath("/buddies");
  revalidatePath("/community");
}

export async function sendBuddyNote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/buddies");
  const otherId = String(formData.get("user_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 280);
  if (!body || !otherId) return;
  await updateDb((db) => {
    const link = linkBetween(db.buddyLinks ?? [], user.user_id, otherId);
    if (!link || link.status !== "accepted") return;
    if (!db.buddyNotes) db.buddyNotes = [];
    db.buddyNotes.push({
      note_id: randomUUID(),
      from_user_id: user.user_id,
      to_user_id: otherId,
      body,
      created_at: now(),
    });
  });
  revalidatePath("/buddies");
  revalidatePath("/community");
}

export async function awardBadge(formData: FormData) {
  const user = await getCurrentUser();
  const slug = String(formData.get("slug") ?? "");
  if (!user) redirect(`/login?next=/manage/${slug}/gardeners`);
  const gardenerId = String(formData.get("user_id") ?? "");
  const badgeId = String(formData.get("badge_id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 160);
  if (!isManagerAward(badgeId) || !gardenerId) return;
  await updateDb((db) => {
    const garden = gardenBySlug(db, slug);
    if (!garden || !managesGarden(db, user.user_id, garden.garden_id)) return;
    if (!db.awardedBadges) db.awardedBadges = [];
    const already = db.awardedBadges.some(
      (award) => award.garden_id === garden.garden_id && award.user_id === gardenerId && award.badge_id === badgeId,
    );
    if (already) return;
    db.awardedBadges.push({
      award_id: randomUUID(),
      garden_id: garden.garden_id,
      user_id: gardenerId,
      badge_id: badgeId,
      note,
      awarded_by: user.user_id,
      created_at: now(),
    });
  });
  revalidatePath(`/manage/${slug}/gardeners`);
  revalidatePath("/achievements");
}

export async function toggleSavedEvent(formData: FormData) {
  const user = await getCurrentUser();
  const next = String(formData.get("next") ?? "/saved");
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext(next, "/saved"))}`);
  const eventId = String(formData.get("event_id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!eventId || !date) return;
  await updateDb((db) => {
    if (!db.savedEvents) db.savedEvents = [];
    const existing = db.savedEvents.find((item) => item.user_id === user.user_id && item.event_id === eventId && item.occurrence_date === date);
    if (existing) db.savedEvents = db.savedEvents.filter((item) => item.save_id !== existing.save_id);
    else if (db.events.some((event) => event.event_id === eventId)) {
      db.savedEvents.push({ save_id: randomUUID(), user_id: user.user_id, event_id: eventId, occurrence_date: date, created_at: now() });
    }
  });
  revalidatePath("/saved");
  revalidatePath("/events");
}

export async function toggleVolunteerOffer(formData: FormData) {
  const user = await getCurrentUser();
  const next = String(formData.get("next") ?? "/volunteer");
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNext(next, "/volunteer"))}`);
  const gardenId = String(formData.get("garden_id") ?? "");
  const eventId = String(formData.get("event_id") ?? "");
  const date = String(formData.get("date") ?? "");
  if (!gardenId || !eventId || !date) return;
  await updateDb((db) => {
    if (!db.volunteerOffers) db.volunteerOffers = [];
    const existing = db.volunteerOffers.find(
      (item) => item.user_id === user.user_id && item.event_id === eventId && item.occurrence_date === date,
    );
    if (existing) db.volunteerOffers = db.volunteerOffers.filter((item) => item.offer_id !== existing.offer_id);
    else {
      db.volunteerOffers.push({
        offer_id: randomUUID(),
        garden_id: gardenId,
        event_id: eventId,
        occurrence_date: date,
        user_id: user.user_id,
        created_at: now(),
      });
    }
  });
  revalidatePath("/volunteer");
  revalidatePath("/", "layout");
}
