import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function saveImage(file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("type");
  if (file.size > MAX_BYTES) throw new Error("size");
  const ext = ALLOWED.get(file.type)!;
  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}
