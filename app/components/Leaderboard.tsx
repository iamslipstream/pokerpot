import { Avatar } from "@/app/components/Avatar";
import { centsToEuros } from "@/lib/money";
import type { PlayerStats } from "@/lib/stats";
import type { PhotoMap } from "@/lib/photos";

const MEDAL = ["🥇", "🥈", "🥉"];

function netClass(n: number): string {
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-zinc-500";
}

function roiPillClass(n: number): string {
  if (n > 0)
    return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900";
  if (n < 0)
    return "bg-red-100 text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900";
  return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
}

function formatNet(n: number): string {
  return `${n > 0 ? "+" : ""}${centsToEuros(n)}`;
}

function formatRoi(roi: number): string {
  const pct = Math.round(roi * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function Badges({ s }: { s: PlayerStats }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {s.isWhale && (
        <span
          title={`Whale — most bought in (${centsToEuros(s.totalBuyIn)})`}
          className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
        >
          🐋 Whale
        </span>
      )}
      {s.isRock && (
        <span
          title="Rock — steadiest player"
          className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-800 dark:bg-stone-800 dark:text-stone-200"
        >
          🪨 Rock
        </span>
      )}
      {s.streak && (
        <span
          title={`${s.streak.count} ${s.streak.kind === "win" ? "wins" : "losses"} in a row`}
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            s.streak.kind === "win"
              ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {s.streak.kind === "win" ? "🔥" : "🥶"} {s.streak.count}
        </span>
      )}
    </div>
  );
}

function rankBadgeClass(rank: number): string {
  if (rank === 1)
    return "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-900/60 dark:text-amber-100 dark:ring-amber-700";
  if (rank === 2)
    return "bg-zinc-200 text-zinc-800 ring-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600";
  if (rank === 3)
    return "bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-900/60 dark:text-orange-100 dark:ring-orange-700";
  return "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700";
}

function rowClass(rank: number): string {
  if (rank === 1)
    return "border-amber-300 bg-gradient-to-r from-amber-50 to-white dark:border-amber-700/50 dark:from-amber-950/30 dark:to-zinc-950/80";
  if (rank === 2)
    return "border-zinc-300 bg-gradient-to-r from-zinc-50 to-white dark:border-zinc-600 dark:from-zinc-800/40 dark:to-zinc-950/80";
  if (rank === 3)
    return "border-orange-300 bg-gradient-to-r from-orange-50 to-white dark:border-orange-700/50 dark:from-orange-950/30 dark:to-zinc-950/80";
  return "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80";
}

export function Leaderboard({
  stats,
  photoMap,
  totalSettledGames,
}: {
  stats: PlayerStats[];
  photoMap: PhotoMap;
  totalSettledGames: number;
}) {
  if (stats.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-zinc-50">
            Leaderboard
          </h2>
          <p className="text-xs text-zinc-500">
            Ranked by ROI · {totalSettledGames} settled{" "}
            {totalSettledGames === 1 ? "game" : "games"}
          </p>
        </div>
      </div>

      {/* How it works ----------------------------------------------------- */}
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-zinc-300">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          How ranking works:
        </span>{" "}
        ROI is your profit per €1 bought in.{" "}
        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
          +50%
        </span>{" "}
        = bought in €100, cashed out €150.{" "}
        <span className="font-mono font-semibold text-red-700 dark:text-red-400">
          −20%
        </span>{" "}
        = bought in €100, walked with €80. Highest ROI wins; ties go to whoever
        put more money on the table.
      </div>

      {/* All players in a single ranked list ---------------------------- */}
      <ul className="stagger flex flex-col gap-2">
        {stats.map((s, idx) => {
          const rank = idx + 1;
          const isTop3 = rank <= 3;
          return (
            <li
              key={s.normalizedName}
              className={`card-lift flex items-center gap-3 rounded-xl border p-3 backdrop-blur ${rowClass(rank)}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ring-1 ${rankBadgeClass(rank)}`}
              >
                {isTop3 ? MEDAL[rank - 1] : rank}
              </span>
              <Avatar name={s.displayName} photoMap={photoMap} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`font-medium text-black dark:text-zinc-50 ${rank === 1 ? "font-bold" : ""}`}>
                    {s.displayName}
                  </span>
                  <Badges s={s} />
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {s.gamesPlayed}{" "}
                  {s.gamesPlayed === 1 ? "game" : "games"} ·{" "}
                  {centsToEuros(s.totalBuyIn)} in
                </div>
              </div>
              <div
                className="flex flex-col items-end gap-1"
                title={`ROI ${formatRoi(s.roi)} = net ${formatNet(s.lifetimeNet)} on ${centsToEuros(s.totalBuyIn)} buy-in`}
              >
                <div className={`inline-flex items-baseline gap-1 rounded-full px-2.5 py-0.5 ${roiPillClass(s.lifetimeNet)}`}>
                  <span className={`font-mono leading-none ${rank === 1 ? "text-base font-extrabold" : "text-sm font-bold"}`}>
                    {formatRoi(s.roi)}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                    ROI
                  </span>
                </div>
                <div className={`font-mono text-xs font-medium ${netClass(s.lifetimeNet)}`}>
                  {formatNet(s.lifetimeNet)}{" "}
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">
                    Net
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Per-player breakdown for top 3 ---------------------------------- */}
      <details className="mt-4 rounded-xl border border-zinc-200 bg-white/60 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-zinc-500">
          Show full stats
        </summary>
        <div className="mt-3 flex items-center gap-3 border-b border-zinc-200 px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
          <span className="w-7 shrink-0 text-center">#</span>
          <span className="min-w-0 flex-1">Player</span>
          <span>Games</span>
          <span className="w-16 text-right">Bought in</span>
          <span className="w-20 text-right">Net P/L</span>
          <span className="w-16 text-center">ROI</span>
        </div>
        <ul className="mt-1 flex flex-col">
          {stats.map((s, i) => (
            <li
              key={s.normalizedName}
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm odd:bg-zinc-50/60 dark:odd:bg-zinc-900/40"
            >
              <span className="w-7 shrink-0 text-center font-mono text-xs font-semibold text-zinc-400">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{s.displayName}</span>
              <span className="font-mono text-xs text-zinc-500">{s.gamesPlayed}g</span>
              <span className="w-16 text-right font-mono text-xs text-zinc-500">
                {centsToEuros(s.totalBuyIn)}
              </span>
              <span className={`w-20 text-right font-mono text-xs font-medium ${netClass(s.lifetimeNet)}`}>
                {formatNet(s.lifetimeNet)}
              </span>
              <span className={`inline-flex w-16 justify-center rounded-full px-2 py-0.5 text-right font-mono text-xs font-bold ${roiPillClass(s.lifetimeNet)}`}>
                {formatRoi(s.roi)}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <p className="mt-3 text-[10px] text-zinc-400">
        Players matched by name (case-insensitive). Use consistent names across
        games for accurate stats.
      </p>
    </section>
  );
}
