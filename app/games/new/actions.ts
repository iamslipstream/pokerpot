"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eurosToCents } from "@/lib/money";
import { generateSlug } from "@/lib/slug";
import { DEFAULT_CHIPS } from "@/lib/chips";
import { redirect } from "next/navigation";

export async function createGame(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");

  const name = ((formData.get("name") as string | null) ?? "").trim() || null;
  const buyInRaw = (formData.get("defaultBuyIn") as string | null) ?? "20";
  const playersRaw = (formData.get("players") as string | null) ?? "";

  const defaultBuyIn = eurosToCents(buyInRaw);
  if (defaultBuyIn <= 0) throw new Error("Buy-in must be positive");

  const playerNames = playersRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (playerNames.length < 2) {
    throw new Error("Add at least 2 players");
  }

  const game = await prisma.game.create({
    data: {
      name,
      hostId: session.user.id,
      defaultBuyIn,
      chipDenominations: DEFAULT_CHIPS,
      players: {
        create: playerNames.map((pName) => ({
          name: pName,
          slug: generateSlug(),
          buyIns: { create: { amount: defaultBuyIn } },
        })),
      },
    },
  });

  redirect(`/games/${game.id}`);
}
