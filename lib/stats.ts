import { prisma } from "@/lib/prisma";

export type Streak = {
  kind: "win" | "loss";
  count: number;
};

export type PlayerStats = {
  displayName: string; // most common casing
  normalizedName: string; // lowercase, trimmed — used for grouping
  lifetimeNet: number; // cents
  gamesPlayed: number;
  bestNight: number; // cents (max net in a single game)
  worstNight: number; // cents (min net, can be negative)
  totalBuyIn: number; // cents — for "whale" title
  roi: number; // lifetimeNet / totalBuyIn (e.g. 0.42 = +42%); 0 when totalBuyIn is 0
  variance: number; // population variance of per-night net (cents²) — for "rock" title
  streak: Streak | null; // current consecutive same-direction streak (>=2 only)
  // Title flags — set after the array is computed
  isWhale: boolean;
  isRock: boolean;
};

export async function getLifetimeStats(
  hostId: string
): Promise<{ stats: PlayerStats[]; totalSettledGames: number }> {
  const settledGames = await prisma.game.findMany({
    where: { hostId, status: "settled" },
    include: { players: { include: { buyIns: true } } },
    orderBy: { endedAt: "asc" },
  });

  type Entry = {
    nameCounts: Map<string, number>;
    nets: number[]; // per-game net, in chronological order
    totalNet: number;
    totalBuyIn: number;
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
          nets: [],
          totalNet: 0,
          totalBuyIn: 0,
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
      entry.nets.push(net);
      entry.totalNet += net;
      entry.totalBuyIn += totalBuyIn;
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

      // Variance — population variance of per-game net.
      const mean = e.totalNet / e.games;
      let variance = 0;
      for (const n of e.nets) variance += (n - mean) ** 2;
      variance /= e.games;

      // Current streak — walk backwards from most recent settled game.
      let streak: Streak | null = null;
      if (e.nets.length >= 2) {
        const last = e.nets[e.nets.length - 1];
        if (last !== 0) {
          const kind: "win" | "loss" = last > 0 ? "win" : "loss";
          let count = 1;
          for (let i = e.nets.length - 2; i >= 0; i--) {
            const v = e.nets[i];
            if ((kind === "win" && v > 0) || (kind === "loss" && v < 0)) {
              count++;
            } else {
              break;
            }
          }
          if (count >= 2) streak = { kind, count };
        }
      }

      const roi = e.totalBuyIn > 0 ? e.totalNet / e.totalBuyIn : 0;

      return {
        displayName,
        normalizedName: key,
        lifetimeNet: e.totalNet,
        gamesPlayed: e.games,
        bestNight: e.best,
        worstNight: e.worst,
        totalBuyIn: e.totalBuyIn,
        roi,
        variance,
        streak,
        isWhale: false,
        isRock: false,
      };
    })
    .sort((a, b) => {
      if (b.roi !== a.roi) return b.roi - a.roi;
      // Tiebreak: more total buy-in volume wins (larger sample, same %)
      return b.totalBuyIn - a.totalBuyIn;
    });

  // Whale: most cumulative buy-in. Rock: smallest variance (≥3 games).
  if (stats.length > 0) {
    const whale = stats.reduce((a, b) =>
      b.totalBuyIn > a.totalBuyIn ? b : a
    );
    whale.isWhale = true;

    const rockCandidates = stats.filter((s) => s.gamesPlayed >= 3);
    if (rockCandidates.length > 0) {
      const rock = rockCandidates.reduce((a, b) =>
        b.variance < a.variance ? b : a
      );
      rock.isRock = true;
    }
  }

  return { stats, totalSettledGames: settledGames.length };
}
