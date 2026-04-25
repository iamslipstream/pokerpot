"use server";

import { prisma } from "@/lib/prisma";
import { eurosToCents } from "@/lib/money";
import { parseChipDenominations } from "@/lib/chips";
import { detectChipsFromImage, type DetectedCounts } from "@/lib/vision";
import { revalidatePath } from "next/cache";

export async function submitFinalAmount(formData: FormData) {
  const slug = formData.get("slug") as string;
  const amountRaw = (formData.get("finalAmount") as string | null) ?? "";

  const player = await prisma.player.findUnique({
    where: { slug },
    include: { game: true },
  });
  if (!player) throw new Error("Player not found");
  if (player.game.status === "settled") {
    throw new Error("Game already settled — ask the host to reopen it");
  }

  const finalAmount = eurosToCents(amountRaw);
  if (finalAmount < 0) throw new Error("Amount cannot be negative");

  await prisma.player.update({
    where: { id: player.id },
    data: { finalAmount, enteredAt: new Date() },
  });

  revalidatePath(`/play/${slug}`);
  revalidatePath(`/games/${player.gameId}`);
}

export async function detectChipsFromPhoto(formData: FormData): Promise<{
  counts: DetectedCounts;
}> {
  const slug = formData.get("slug") as string;
  const file = formData.get("image") as File | null;

  if (!file) throw new Error("No image uploaded");
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image too big (max 5MB) — try retaking the photo");
  }

  const player = await prisma.player.findUnique({
    where: { slug },
    include: { game: true },
  });
  if (!player) throw new Error("Player not found");

  const denominations = parseChipDenominations(player.game.chipDenominations);
  if (denominations.length === 0) {
    throw new Error(
      "Host hasn't configured chip denominations for this game yet."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const mediaTypeRaw = file.type || "image/jpeg";
  const mediaType =
    mediaTypeRaw === "image/png" ||
    mediaTypeRaw === "image/webp" ||
    mediaTypeRaw === "image/gif"
      ? mediaTypeRaw
      : "image/jpeg";

  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Vision is not configured (GROQ_API_KEY missing). Enter your amount manually."
    );
  }

  const counts = await detectChipsFromImage(base64, mediaType, denominations);
  return { counts };
}
