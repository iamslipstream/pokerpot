"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eurosToCents } from "@/lib/money";
import { generateSlug } from "@/lib/slug";
import type { ChipDenomination } from "@/lib/chips";
import { revalidatePath } from "next/cache";

async function ownGameOrThrow(gameId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.hostId !== session.user.id) {
    throw new Error("Not allowed");
  }
  return game;
}

export async function addPlayer(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const game = await ownGameOrThrow(gameId);
  if (game.status !== "setup") {
    throw new Error("Players can only be added during setup");
  }
  const name = ((formData.get("name") as string | null) ?? "").trim();
  if (!name) throw new Error("Name required");

  await prisma.player.create({
    data: {
      gameId,
      name,
      slug: generateSlug(),
      buyIns: { create: { amount: game.defaultBuyIn } },
    },
  });

  revalidatePath(`/games/${gameId}`);
}

export async function rebuy(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const playerId = formData.get("playerId") as string;
  const game = await ownGameOrThrow(gameId);
  if (game.status === "settled") throw new Error("Game is already settled");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.gameId !== gameId) throw new Error("Bad player");

  await prisma.buyIn.create({
    data: { playerId, amount: game.defaultBuyIn },
  });

  revalidatePath(`/games/${gameId}`);
}

export async function addCustomBuyIn(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const playerId = formData.get("playerId") as string;
  const amountRaw = (formData.get("amount") as string | null) ?? "0";
  const game = await ownGameOrThrow(gameId);
  if (game.status === "settled") throw new Error("Game is already settled");

  const amount = eurosToCents(amountRaw);
  if (amount <= 0) throw new Error("Amount must be positive");

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.gameId !== gameId) throw new Error("Bad player");

  await prisma.buyIn.create({ data: { playerId, amount } });
  revalidatePath(`/games/${gameId}`);
}

export async function deleteBuyIn(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const buyInId = formData.get("buyInId") as string;
  const game = await ownGameOrThrow(gameId);
  if (game.status === "settled") throw new Error("Game is already settled");

  const buyIn = await prisma.buyIn.findUnique({
    where: { id: buyInId },
    include: { player: true },
  });
  if (!buyIn || buyIn.player.gameId !== gameId) throw new Error("Bad buyin");

  await prisma.buyIn.delete({ where: { id: buyInId } });
  revalidatePath(`/games/${gameId}`);
}

export async function removePlayer(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const playerId = formData.get("playerId") as string;
  const game = await ownGameOrThrow(gameId);
  if (game.status !== "setup") {
    throw new Error("Players can only be removed during setup");
  }
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player || player.gameId !== gameId) throw new Error("Bad player");

  await prisma.player.delete({ where: { id: playerId } });
  revalidatePath(`/games/${gameId}`);
}

export async function setStatus(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  const next = formData.get("status") as string;
  const game = await ownGameOrThrow(gameId);

  if (!["setup", "cashout", "settled"].includes(next)) {
    throw new Error("Bad status");
  }

  // Validate transitions
  if (next === "settled") {
    const players = await prisma.player.findMany({ where: { gameId } });
    const missing = players.filter((p) => p.finalAmount == null);
    if (missing.length > 0) {
      throw new Error(
        `Waiting on cash-out from: ${missing.map((p) => p.name).join(", ")}`
      );
    }
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      status: next,
      endedAt: next === "settled" ? new Date() : null,
    },
  });

  revalidatePath(`/games/${gameId}`);
}

export async function deleteGame(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  await ownGameOrThrow(gameId);
  await prisma.game.delete({ where: { id: gameId } });
  revalidatePath("/dashboard");
}

export async function setChipDenominations(formData: FormData) {
  const gameId = formData.get("gameId") as string;
  await ownGameOrThrow(gameId);

  const colors = formData.getAll("color") as string[];
  const values = formData.getAll("value") as string[];
  if (colors.length !== values.length) {
    throw new Error("Mismatched chip rows");
  }

  const seen = new Set<string>();
  const chips: ChipDenomination[] = [];
  for (let i = 0; i < colors.length; i++) {
    const color = colors[i].trim().toLowerCase();
    const valueStr = values[i].trim();
    if (!color || !valueStr) continue;
    if (seen.has(color)) {
      throw new Error(`Duplicate color: ${color}`);
    }
    const value = eurosToCents(valueStr);
    if (value <= 0) throw new Error(`Chip "${color}" must have a positive value`);
    seen.add(color);
    chips.push({ color, value });
  }

  if (chips.length === 0) throw new Error("Add at least one chip color");

  await prisma.game.update({
    where: { id: gameId },
    data: { chipDenominations: chips },
  });

  revalidatePath(`/games/${gameId}`);
}
