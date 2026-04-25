import { prisma } from "@/lib/prisma";

export type PlayerStats = {
  displayName: string; // most common casing
  normalizedName: string; // lowercase, trimmed — used for grouping
  lifetimeNet: number; // cents
  gamesPlayed: number;
  bestNight: number; // cents (max net in a single game)
  worstNight: number; // cents (min net, can be negative)
};

export async function getLifetimeStats(
  hostId: string
): Promise<{ stats: PlayerStats[]; totalSettledGames: number }> {
  const settledGames = await prisma.game.findMany({
    where: { hostId, status: "settled" },
    include: { players: { include: { buyIns: true } } },
  });

  type Entry = {
    nameCounts: Map<string, number>;
    totalNet: number;
    games: number;
    best: number;
    worst: number;
  };
  const byName = new Map<string, Entry>();

  for (const game of settledGames) {
    for (const p of game.players) {
      if (p.finalAmount === null) continue;
      const totalBuyIn = p.buyIns.reduce((s, b) => s + b.amount, 0);
      const net = p.finalAmount - totalBuyIn;
      const key = p.name.trim().toLowerCase();

      let entry = byName.get(key);
      if (!entry) {
        entry = {
          nameCounts: new Map(),
          totalNet: 0,
          games: 0,
          best: net,
          worst: net,
        };
        byName.set(key, entry);
      }
      const original = p.name.trim();
      entry.nameCounts.set(
        original,
        (entry.nameCounts.get(original) ?? 0) + 1
      );
      entry.totalNet += net;
      entry.games += 1;
      if (net > entry.best) entry.best = net;
      if (net < entry.worst) entry.worst = net;
    }
  }

  const stats: PlayerStats[] = [...byName.entries()]
    .map(([key, e]) => {
      let displayName = "";
      let bestCount = 0;
      for (const [name, count] of e.nameCounts) {
        if (count > bestCount) {
          bestCount = count;
          displayName = name;
        }
      }
      return {
        displayName,
        normalizedName: key,
        lifetimeNet: e.totalNet,
        gamesPlayed: e.games,
        bestNight: e.best,
        worstNight: e.worst,
      };
    })
    .sort((a, b) => b.lifetimeNet - a.lifetimeNet);

  return { stats, totalSettledGames: settledGames.length };
}
