import { readdir } from "node:fs/promises";
import path from "node:path";

const PHOTO_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

export function playerSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type PhotoMap = Map<string, string>;

export async function getPlayerPhotoMap(): Promise<PhotoMap> {
  const dir = path.join(process.cwd(), "public", "players");
  const map: PhotoMap = new Map();
  try {
    const files = await readdir(dir);
    for (const f of files) {
      const ext = path.extname(f).toLowerCase();
      if (!PHOTO_EXTS.includes(ext)) continue;
      const base = path.basename(f, ext).toLowerCase();
      if (!map.has(base)) map.set(base, f);
    }
  } catch {
    // directory missing — no photos available
  }
  return map;
}

export function photoSrcFor(
  name: string,
  photoMap: PhotoMap
): string | null {
  const file = photoMap.get(playerSlug(name));
  return file ? `/players/${file}` : null;
}
