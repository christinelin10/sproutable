"use server";

import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { clearSession, getCurrentUser, hashPassword, setSession, verifyPassword } from "@/lib/auth";
import { updateDb } from "@/lib/data/store";
import { defaultModules, INVOLVEMENT } from "@/lib/gardens";
import { saveImage } from "@/lib/uploads";
import { userByEmail } from "@/lib/permissions";
import { slugify } from "@/lib/slug";
import type { Language } from "@/lib/types";

export type ActionState = { error?: string; ok?: boolean } | null;

const emailSchema = z.string().trim().email();

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  if (!next.startsWith("/") || next.startsWith("//")) return "";
  return next;
}

async function rememberLanguage(language: Language) {
  const jar = await cookies();
  jar.set("locale", language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function signup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const accountType = formData.get("account_type") === "manager" ? "manager" : "user";
  const name = String(formData.get("name") ?? "").trim();
  const emailResult = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const language: Language = formData.get("language") === "es" ? "es" : "en";
  const phone = String(formData.get("phone") ?? "").trim();

  if (name.length < 2) return { error: "required" };
  if (!emailResult.success) return { error: "email" };
  if (password.length < 8) return { error: "password" };

  const gardenName = String(formData.get("garden_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const description = String(formData.get("description_en") ?? "").trim();
  const descriptionEs = String(formData.get("description_es") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();

  if (accountType === "manager") {
    if (!gardenName || !address || !neighborhood || !description) return { error: "required" };
    if (!emailSchema.safeParse(contactEmail).success) return { error: "email" };
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  let slug = "";

  try {
    await updateDb(async (db) => {
      if (userByEmail(db, emailResult.data)) throw new Error("taken");
      db.users.push({
        user_id: userId,
        name,
        email: emailResult.data.toLowerCase(),
        password_hash: passwordHash,
        account_type: accountType,
        language,
        phone,
        interest_tags: "",
        created_at: new Date().toISOString(),
        status: "active",
      });
      if (accountType === "manager") {
        const gardenId = randomUUID();
        slug = slugify(gardenName);
        let n = 2;
        while (db.gardens.some((garden) => garden.slug === slug)) slug = `${slugify(gardenName)}-${n++}`;
        const options = INVOLVEMENT.filter((option) => formData.get(`inv_${option}`) === "on");
        const garden = {
          garden_id: gardenId,
          slug,
          name: gardenName,
          description_en: description,
          description_es: descriptionEs,
          address,
          neighborhood,
          timezone: "America/New_York",
          contact_email: contactEmail.toLowerCase(),
          contact_phone: contactPhone,
          year_founded: String(formData.get("year_founded") ?? "").trim(),
          bed_count: String(formData.get("bed_count") ?? "").trim(),
          cover_image_url: "/seed/riverside.svg",
          involvement_options: (options.length ? options : ["volunteer", "events"]).join(","),
          verified: false,
          created_by: userId,
          created_at: new Date().toISOString(),
        };
        const cover = formData.get("cover");
        if (cover instanceof File && cover.size > 0) garden.cover_image_url = await saveImage(cover);
        db.gardens.push(garden);
        db.gardenManagers.push({ garden_id: gardenId, user_id: userId, added_at: new Date().toISOString() });
        db.homeModules.push(...defaultModules(garden, randomUUID));
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "taken") return { error: "taken" };
    if (error instanceof Error && (error.message === "type" || error.message === "size")) return { error: "size" };
    throw error;
  }

  await setSession(userId);
  await rememberLanguage(language);
  redirect(accountType === "manager" ? "/dashboard?welcome=1" : "/gardens?welcome=1");
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const emailResult = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!emailResult.success || !password) return { error: "invalid_login" };
  const { readDb } = await import("@/lib/data/store");
  const db = await readDb();
  const user = userByEmail(db, emailResult.data);
  if (!user || !(await verifyPassword(password, user.password_hash))) return { error: "invalid_login" };
  await setSession(user.user_id);
  await rememberLanguage(user.language);
  const next = safeNext(formData.get("next"));
  redirect(next || (user.account_type === "manager" ? "/dashboard" : "/gardens"));
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function setLocale(locale: Language) {
  await rememberLanguage(locale);
  const user = await getCurrentUser();
  if (user) {
    await updateDb((db) => {
      const row = db.users.find((item) => item.user_id === user.user_id);
      if (row) row.language = locale;
    });
  }
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings/profile");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const language: Language = formData.get("language") === "es" ? "es" : "en";
  const checks = ["bed", "volunteer", "events", "produce", "learn"].filter((option) => formData.get(`tag_${option}`) === "on");
  const tags = checks.length ? checks.join(",") : String(formData.get("interest_tags") ?? "").trim();
  const nextPassword = String(formData.get("new_password") ?? "");
  if (name.length < 2) return { error: "required" };
  if (nextPassword && nextPassword.length < 8) return { error: "password" };
  const passwordHash = nextPassword ? await hashPassword(nextPassword) : "";
  await updateDb((db) => {
    const row = db.users.find((item) => item.user_id === user.user_id);
    if (!row) return;
    row.name = name;
    row.phone = phone;
    row.language = language;
    row.interest_tags = tags;
    if (passwordHash) row.password_hash = passwordHash;
  });
  await rememberLanguage(language);
  redirect("/settings/profile?notice=saved");
}
