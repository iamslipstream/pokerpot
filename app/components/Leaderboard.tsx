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

function formatNet(n: number): string {
  return `${n > 0 ? "+" : ""}${centsToEuros(n)}`;
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

function PodiumStep({
  s,
  rank,
  photoMap,
  height,
  ringColor,
}: {
  s: PlayerStats;
  rank: 1 | 2 | 3;
  photoMap: PhotoMap;
  height: string;
  ringColor: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl drop-shadow-sm">{MEDAL[rank - 1]}</span>
        <div className={`rounded-full p-1 ring-2 ${ringColor}`}>
          <Avatar
            name={s.displayName}
            photoMap={photoMap}
            size={rank === 1 ? "xl" : "lg"}
            ring="none"
          />
        </div>
        <div className="min-w-0 max-w-full text-center">
          <div className="truncate text-sm font-semibold text-black dark:text-zinc-50">
            {s.displayName}
          </div>
          <div className={`font-mono text-base font-bold ${netClass(s.lifetimeNet)}`}>
            {formatNet(s.lifetimeNet)}
          </div>
          <div className="text-[10px] text-zinc-500">
            {s.gamesPlayed} {s.gamesPlayed === 1 ? "game" : "games"}
          </div>
        </div>
        <Badges s={s} />
      </div>
      <div
        className={`mt-3 w-full rounded-t-lg bg-gradient-to-b ${
          rank === 1
            ? "from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-800"
            : rank === 2
              ? "from-zinc-200 to-zinc-300 dark:from-zinc-600 dark:to-zinc-700"
              : "from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-900"
        } ${height} flex items-start justify-center pt-1.5`}
      >
        <span className="text-xs font-bold text-zinc-700/70 dark:text-zinc-100/70">
          {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
        </span>
      </div>
    </div>
  );
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

  const top3 = stats.slice(0, 3);
  const rest = stats.slice(3);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-black dark:text-zinc-50">
            Leaderboard
          </h2>
          <p className="text-xs text-zinc-500">
            {totalSettledGames} settled{" "}
            {totalSettledGames === 1 ? "game" : "games"}
          </p>
        </div>
      </div>

      {/* Podium ----------------------------------------------------------- */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-white via-amber-50/40 to-emerald-50/40 p-4 pb-0 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-amber-950/20 dark:to-emerald-950/20">
        <div className="flex items-end justify-center gap-2 sm:gap-4">
          {/* 2nd — left */}
          {top3[1] ? (
            <PodiumStep
              s={top3[1]}
              rank={2}
              photoMap={photoMap}
              height="h-16"
              ringColor="ring-zinc-300 dark:ring-zinc-600"
            />
          ) : (
            <div className="min-w-0 flex-1" />
          )}

          {/* 1st — middle, tallest */}
          {top3[0] && (
            <PodiumStep
              s={top3[0]}
              rank={1}
              photoMap={photoMap}
              height="h-24"
              ringColor="ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-black"
            />
          )}

          {/* 3rd — right */}
          {top3[2] ? (
            <PodiumStep
              s={top3[2]}
              rank={3}
              photoMap={photoMap}
              height="h-12"
              ringColor="ring-orange-300 dark:ring-orange-700"
            />
          ) : (
            <div className="min-w-0 flex-1" />
          )}
        </div>
      </div>

      {/* Ranks 4+ --------------------------------------------------------- */}
      {rest.length > 0 && (
        <ul className="stagger mt-3 flex flex-col gap-2">
          {rest.map((s, idx) => {
            const rank = idx + 4;
            return (
              <li
                key={s.normalizedName}
                className="card-lift flex items-center gap-3 rounded-xl border border-zinc-200 bg-white/80 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80"
              >
                <span className="w-7 shrink-0 text-center font-mono text-sm font-semibold text-zinc-400">
                  {rank}
                </span>
                <Avatar name={s.displayName} photoMap={photoMap} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-black dark:text-zinc-50">
                      {s.displayName}
                    </span>
                    <Badges s={s} />
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {s.gamesPlayed}{" "}
                    {s.gamesPlayed === 1 ? "game" : "games"}
                  </div>
                </div>
                <div className={`font-mono text-base ${netClass(s.lifetimeNet)}`}>
                  {formatNet(s.lifetimeNet)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Per-player breakdown for top 3 ---------------------------------- */}
      <details className="mt-4 rounded-xl border border-zinc-200 bg-white/60 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-zinc-500">
          Show full stats
        </summary>
        <ul className="mt-3 flex flex-col gap-2">
          {stats.map((s, i) => (
            <li
              key={s.normalizedName}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm"
            >
              <span className="w-7 shrink-0 text-center font-mono text-xs text-zinc-400">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate">{s.displayName}</span>
              <span className="text-xs text-zinc-500">{s.gamesPlayed}g</span>
              <span className={`w-20 text-right font-mono ${netClass(s.lifetimeNet)}`}>
                {formatNet(s.lifetimeNet)}
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
