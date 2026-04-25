import { prisma } from "@/lib/prisma";
import { centsToEuros } from "@/lib/money";
import { settle } from "@/lib/settle";
import { parseChipDenominations } from "@/lib/chips";
import { notFound } from "next/navigation";
import { CashoutEntry } from "./CashoutEntry";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const player = await prisma.player.findUnique({
    where: { slug },
    include: { game: true },
  });
  if (!player) return { title: "Pokerpot" };
  return {
    title: `${player.name} — ${player.game.name ?? "Poker game"}`,
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const player = await prisma.player.findUnique({
    where: { slug },
    include: {
      buyIns: { orderBy: { createdAt: "asc" } },
      game: {
        include: {
          players: { include: { buyIns: true } },
        },
      },
    },
  });

  if (!player) notFound();

  const totalBuyIn = player.buyIns.reduce((s, b) => s + b.amount, 0);
  const status = player.game.status;
  const chipDenoms = parseChipDenominations(player.game.chipDenominations);

  // Compute settlements if game is settled
  let myTxns: { fromName: string; toName: string; amount: number; iAmFrom: boolean }[] = [];
  let allTxns: ReturnType<typeof settle> = [];
  let myNet: number | null = null;
  if (status === "settled") {
    const allEntered = player.game.players.every((p) => p.finalAmount !== null);
    if (allEntered) {
      const balances = player.game.players.map((p) => {
        const buyIn = p.buyIns.reduce((s, b) => s + b.amount, 0);
        return {
          playerId: p.id,
          name: p.name,
          net: (p.finalAmount ?? 0) - buyIn,
        };
      });
      allTxns = settle(balances);
      myNet = balances.find((b) => b.playerId === player.id)?.net ?? 0;
      myTxns = allTxns
        .filter((t) => t.fromId === player.id || t.toId === player.id)
        .map((t) => ({
          fromName: t.fromName,
          toName: t.toName,
          amount: t.amount,
          iAmFrom: t.fromId === player.id,
        }));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100 via-white to-amber-100 dark:from-emerald-950 dark:via-black dark:to-amber-950" />

      <div className="relative z-10 mx-auto w-full max-w-md">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {player.game.name ?? "Poker game"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Hi, {player.name}
        </h1>

        {/* Buy-ins summary */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Your buy-ins
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {player.buyIns.length === 0 ? (
              <li className="text-sm text-zinc-400">none yet</li>
            ) : (
              player.buyIns.map((b) => (
                <li
                  key={b.id}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {centsToEuros(b.amount)}
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-sm">
            Total in:{" "}
            <span className="font-medium">{centsToEuros(totalBuyIn)}</span>
          </p>
        </section>

        {/* Cash-out form */}
        {status !== "settled" ? (
          <div className="mt-6">
            <CashoutEntry
              slug={slug}
              denominations={chipDenoms}
              initialAmount={player.finalAmount}
            />
          </div>
        ) : (
          <>
            {/* Settled view */}
            <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/80">
              <h2 className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                Result
              </h2>
              <p className="mt-2 text-2xl font-semibold">
                {myNet === null
                  ? "—"
                  : myNet >= 0
                    ? `+${centsToEuros(myNet)}`
                    : centsToEuros(myNet)}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {myNet === null
                  ? "Waiting for everyone…"
                  : myNet > 0
                    ? "You won."
                    : myNet < 0
                      ? "You lost."
                      : "You broke even."}
              </p>

              {myTxns.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {myTxns.map((t, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-900"
                    >
                      {t.iAmFrom ? (
                        <>
                          You pay <span className="font-medium">{t.toName}</span>{" "}
                          <span className="font-mono">
                            {centsToEuros(t.amount)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{t.fromName}</span>{" "}
                          pays you{" "}
                          <span className="font-mono">
                            {centsToEuros(t.amount)}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {allTxns.length > 0 && (
              <section className="mt-6 rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
                <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Everyone&apos;s settlements
                </h2>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                  {allTxns.map((t, i) => (
                    <li key={i}>
                      <span className="font-medium">{t.fromName}</span> →{" "}
                      <span className="font-medium">{t.toName}</span>{" "}
                      <span className="font-mono text-zinc-500">
                        {centsToEuros(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <footer className="mt-12 text-center text-xs text-zinc-500">
          Pokerpot
        </footer>
      </div>
    </main>
  );
}
