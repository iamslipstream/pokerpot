import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { centsToEuros } from "@/lib/money";
import { getLifetimeStats } from "@/lib/stats";
import { getPlayerPhotoMap } from "@/lib/photos";
import { Leaderboard } from "@/app/components/Leaderboard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const [games, lifetime, photoMap, latestRecap] = await Promise.all([
    prisma.game.findMany({
      where: { hostId: session.user.id },
      include: { players: { include: { buyIns: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getLifetimeStats(session.user.id),
    getPlayerPhotoMap(),
    prisma.game.findFirst({
      where: {
        hostId: session.user.id,
        status: "settled",
        recap: { not: null },
      },
      orderBy: { endedAt: "desc" },
      select: { id: true, name: true, recap: true, endedAt: true },
    }),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-zinc-50 to-amber-50/60 dark:from-emerald-950/20 dark:via-black dark:to-amber-950/20" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 animate-drift rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-700/15" />

      <div className="relative z-10 mx-auto w-full max-w-2xl animate-fade-in">
        {/* Page header ----------------------------------------------------- */}
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Welcome back
              {session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {session.user.email}
            </p>
          </div>
          <Link
            href="/games/new"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-[1.02] hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <span className="relative z-10">+ New game</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </header>

        {/* AI recap -------------------------------------------------------- */}
        {latestRecap?.recap && (
          <Link
            href={`/games/${latestRecap.id}`}
            className="card-lift group mt-6 block animate-fade-up rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950 dark:via-zinc-950 dark:to-amber-950"
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Last night&apos;s recap
              {latestRecap.name && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  · {latestRecap.name}
                </span>
              )}
            </div>
            <p className="mt-2 font-serif text-lg leading-snug text-zinc-800 dark:text-zinc-100">
              {latestRecap.recap}
            </p>
          </Link>
        )}

        {/* Leaderboard ----------------------------------------------------- */}
        <Leaderboard
          stats={lifetime.stats}
          photoMap={photoMap}
          totalSettledGames={lifetime.totalSettledGames}
        />

        {/* Visual divider -------------------------------------------------- */}
        <div className="mt-12 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Recent games
          </span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        {/* Recent games ---------------------------------------------------- */}
        <ul className="stagger mt-4 flex flex-col gap-3">
          {games.length === 0 ? (
            <li className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
              No games yet. Click <span className="font-medium">New game</span>{" "}
              to get started.
            </li>
          ) : (
            games.map((g) => {
              const totalBuyIn = g.players
                .flatMap((p) => p.buyIns)
                .reduce((s, b) => s + b.amount, 0);
              return (
                <li key={g.id}>
                  <Link
                    href={`/games/${g.id}`}
                    className="card-lift block rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/80 dark:hover:border-zinc-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-black dark:text-zinc-50">
                          {g.name ?? `Game on ${g.createdAt.toLocaleDateString()}`}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {g.players.length} players · pot{" "}
                          {centsToEuros(totalBuyIn)}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          g.status === "settled"
                            ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            : g.status === "cashout"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        }`}
                      >
                        {g.status}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </main>
  );
}
