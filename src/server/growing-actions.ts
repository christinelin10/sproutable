"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { updateDb } from "@/lib/data/store";
import { BEECHVIEW_SLUG } from "@/lib/growing";
import { managesGarden } from "@/lib/permissions";

function now() {
  return new Date().toISOString();
}

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/growing");
  return user;
}

export async function pledgeMoney(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get("dollars") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  const dollars = Number(raw);
  if (!/^\d+$/.test(raw) || dollars < 1 || dollars > 500) {
    redirect("/growing?error=amount#donations");
  }
  await updateDb((db) => {
    const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG);
    if (!garden) return;
    if (!db.moneyDonations) db.moneyDonations = [];
    db.moneyDonations.push({
      donation_id: randomUUID(),
      garden_id: garden.garden_id,
      user_id: user.user_id,
      name: user.name,
      amount_cents: dollars * 100,
      note,
      created_at: now(),
    });
  });
  revalidatePath("/growing");
  redirect("/growing?notice=pledged#donations");
}

export async function offerItem(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 240);
  if (title.length < 2) redirect("/growing?error=item#donations");
  await updateDb((db) => {
    const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG);
    if (!garden) return;
    if (!db.itemDonations) db.itemDonations = [];
    db.itemDonations.push({
      donation_id: randomUUID(),
      garden_id: garden.garden_id,
      title,
      detail,
      status: "offered",
      offered_by: user.user_id,
      offered_name: user.name,
      created_at: now(),
    });
  });
  revalidatePath("/growing");
  redirect("/growing?notice=offered#donations");
}

export async function claimNeed(formData: FormData) {
  const user = await requireUser();
  const donationId = String(formData.get("donation_id") ?? "");
  let error = "";
  await updateDb((db) => {
    const item = (db.itemDonations ?? []).find((row) => row.donation_id === donationId);
    if (!item || item.status !== "needed") {
      error = "taken";
      return;
    }
    item.status = "offered";
    item.offered_by = user.user_id;
    item.offered_name = user.name;
  });
  revalidatePath("/growing");
  redirect(error ? "/growing?error=taken#donations" : "/growing?notice=claimed#donations");
}

export async function postNeed(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  const detail = String(formData.get("detail") ?? "").trim().slice(0, 240);
  if (title.length < 2) redirect("/growing?error=item#donations");
  let denied = false;
  await updateDb((db) => {
    const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG);
    if (!garden || !managesGarden(db, user.user_id, garden.garden_id)) {
      denied = true;
      return;
    }
    if (!db.itemDonations) db.itemDonations = [];
    db.itemDonations.push({
      donation_id: randomUUID(),
      garden_id: garden.garden_id,
      title,
      detail,
      status: "needed",
      offered_by: "",
      offered_name: "",
      created_at: now(),
    });
  });
  revalidatePath("/growing");
  redirect(denied ? "/growing?error=denied#donations" : "/growing?notice=needed#donations");
}

export async function markReceived(formData: FormData) {
  const user = await requireUser();
  const donationId = String(formData.get("donation_id") ?? "");
  let denied = false;
  await updateDb((db) => {
    const garden = db.gardens.find((item) => item.slug === BEECHVIEW_SLUG);
    if (!garden || !managesGarden(db, user.user_id, garden.garden_id)) {
      denied = true;
      return;
    }
    const item = (db.itemDonations ?? []).find((row) => row.donation_id === donationId && row.garden_id === garden.garden_id);
    if (!item || item.status === "received") return;
    item.status = "received";
  });
  revalidatePath("/growing");
  redirect(denied ? "/growing?error=denied#donations" : "/growing?notice=received#donations");
}
