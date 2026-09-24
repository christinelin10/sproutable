import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug, isChatBanned, managesGarden, userById } from "@/lib/permissions";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const db = await readDb();
  const garden = gardenBySlug(db, slug);
  if (!garden) return NextResponse.json({ error: "missing" }, { status: 404 });
  const user = await getCurrentUser();
  const manager = user ? managesGarden(db, user.user_id, garden.garden_id) : false;
  const messages = db.chatMessages
    .filter((message) => message.garden_id === garden.garden_id)
    .slice(-100)
    .map((message) => ({
      id: message.message_id,
      name: userById(db, message.user_id)?.name ?? "Neighbor",
      body: message.deleted && !manager ? "" : message.body,
      createdAt: message.created_at,
      deleted: message.deleted,
      userId: message.user_id,
    }));
  return NextResponse.json({
    messages,
    banned: user ? isChatBanned(db, user.user_id, garden.garden_id) : false,
    canModerate: manager,
  });
}
