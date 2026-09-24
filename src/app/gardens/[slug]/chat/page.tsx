import { ChatRoom } from "@/components/chat-room";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/data/store";
import { gardenBySlug } from "@/lib/permissions";
import { notFound } from "next/navigation";

export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await readDb();
  if (!gardenBySlug(db, slug)) notFound();
  const user = await getCurrentUser();
  return <ChatRoom slug={slug} loggedIn={Boolean(user)} />;
}
