import { promises as fs } from "fs";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import { type Database, emptyDatabase } from "@/lib/types";

export const DB_PATH = path.join(process.cwd(), "data", "db.json");

type Cache = { at: number; data: Database };
let cache: Cache | null = null;
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readFileDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const data = JSON.parse(raw) as Database;
    if (!data.emails) data.emails = [];
    if (!data.itemDonations) data.itemDonations = [];
    if (!data.moneyDonations) data.moneyDonations = [];
    if (!data.gardenTies) data.gardenTies = [];
    if (!data.buddyLinks) data.buddyLinks = [];
    if (!data.buddyNotes) data.buddyNotes = [];
    if (!data.awardedBadges) data.awardedBadges = [];
    if (!data.savedEvents) data.savedEvents = [];
    if (!data.volunteerOffers) data.volunteerOffers = [];
    if (!data.communityPosts) data.communityPosts = [];
    if (!data.produceShares) data.produceShares = [];
    return data;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return emptyDatabase();
    throw error;
  }
}

export async function readDb(): Promise<Database> {
  noStore();
  if (cache && Date.now() - cache.at < 8000) {
    return structuredClone(cache.data);
  }
  const data = await readFileDb();
  cache = { at: Date.now(), data };
  return structuredClone(data);
}

export async function updateDb(mutator: (db: Database) => void | Promise<void>): Promise<Database> {
  return enqueue(async () => {
    const data = await readFileDb();
    await mutator(data);
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    cache = { at: Date.now(), data };
    return structuredClone(data);
  });
}
