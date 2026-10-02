"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateDb } from "@/lib/data/store";
import { rsvpToEvent } from "@/server/garden-actions";

function now() {
  return new Date().toISOString();
}

export async function quickJoin(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/community");
  await rsvpToEvent({
    slug: String(formData.get("slug") ?? ""),
    eventId: String(formData.get("event_id") ?? ""),
    date: String(formData.get("date") ?? ""),
    name: user.name,
    email: user.email,
    partySize: 1,
    volunteer: formData.get("volunteer") === "1",
    note: "",
    cancel: formData.get("cancel") === "1",
  });
  revalidatePath("/community");
  revalidatePath("/saved");
}

export async function createCommunityPost(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/community");
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);
  const gardenId = String(formData.get("garden_id") ?? "");
  if (body.length < 2) return;
  await updateDb((db) => {
    if (!db.communityPosts) db.communityPosts = [];
    if (gardenId && !db.gardens.some((garden) => garden.garden_id === gardenId)) return;
    db.communityPosts.unshift({
      post_id: randomUUID(),
      user_id: user.user_id,
      garden_id: gardenId,
      body,
      created_at: now(),
    });
  });
  revalidatePath("/community");
}

export async function shareProduce(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/growing");
  const crop = String(formData.get("crop") ?? "").trim().slice(0, 80);
  const note = String(formData.get("note") ?? "").trim().slice(0, 180);
  const gardenId = String(formData.get("garden_id") ?? "");
  if (crop.length < 2 || !gardenId) return;
  await updateDb((db) => {
    if (!db.produceShares) db.produceShares = [];
    if (!db.gardens.some((garden) => garden.garden_id === gardenId)) return;
    db.produceShares.unshift({
      share_id: randomUUID(),
      user_id: user.user_id,
      garden_id: gardenId,
      crop,
      note,
      created_at: now(),
    });
  });
  revalidatePath("/growing");
}
