import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { centsToEuros } from "@/lib/money";
import { getLifetimeStats } from "@/lib/stats";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const [games, lifetime] = await Promise.all([
    prisma.game.findMany({
      where: { hostId: session.user.id },
      include: { players: { include: { buyIns: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getLifetimeStats(session.user.id),
  ]);

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Your games
            </h1>
            <p className="text-sm text-zinc-500">
              {session.user.name} · {session.user.email}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Sign out
            </button>
          </form>
        </header>

        <div className="mt-8">
          <Link
            href="/games/new"
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            + New game
          </Link>
        </div>

        <ul className="mt-8 flex flex-col gap-3">
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
                    className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
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

        {lifetime.stats.length > 0 && (
          <section className="mt-12">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Lifetime stats
              </h2>
              <span className="text-xs text-zinc-500">
                {lifetime.totalSettledGames} settled{" "}
                {lifetime.totalSettledGames === 1 ? "game" : "games"}
              </span>
            </div>

            <ul className="mt-3 flex flex-col gap-2">
              {lifetime.stats.map((s, i) => {
                const positive = s.lifetimeNet > 0;
                const negative = s.lifetimeNet < 0;
                return (
                  <li
                    key={s.normalizedName}
                    className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {i === 0 && positive && (
                            <span title="Top winner" className="text-base">
                              👑
                            </span>
                          )}
                          {i === lifetime.stats.length - 1 && negative && (
                            <span title="Biggest loser" className="text-base">
                              💀
                            </span>
                          )}
                          <span className="font-medium text-black dark:text-zinc-50">
                            {s.displayName}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          {s.gamesPlayed}{" "}
                          {s.gamesPlayed === 1 ? "game" : "games"} · best{" "}
                          <span className="font-mono">
                            {s.bestNight >= 0 ? "+" : ""}
                            {centsToEuros(s.bestNight)}
                          </span>{" "}
                          · worst{" "}
                          <span className="font-mono">
                            {s.worstNight >= 0 ? "+" : ""}
                            {centsToEuros(s.worstNight)}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-mono ${
                          positive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : negative
                              ? "text-red-600 dark:text-red-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {centsToEuros(s.lifetimeNet)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 text-xs text-zinc-500">
              Players are matched by name (case-insensitive). Use consistent
              names across games to keep stats accurate.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
