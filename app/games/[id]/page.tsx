import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { centsToEuros } from "@/lib/money";
import { settle } from "@/lib/settle";
import { parseChipDenominations } from "@/lib/chips";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import {
  addPlayer,
  rebuy,
  addCustomBuyIn,
  deleteBuyIn,
  removePlayer,
  setStatus,
  deleteGame,
} from "./actions";
import { ChipsEditor } from "./ChipsEditor";
import { AutoRefresh } from "./AutoRefresh";
import { qrSvgDataUri } from "@/lib/qrcode";
import { getPlayerPhotoMap } from "@/lib/photos";
import { Avatar } from "@/app/components/Avatar";
import { Confetti } from "@/app/components/Confetti";

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  return `${proto}://${host}`;
}

export default async function GameAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin?callbackUrl=/games/${id}`);
  }

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: {
        include: { buyIns: { orderBy: { createdAt: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!game || game.hostId !== session.user.id) notFound();

  const origin = await getOrigin();
  const chipDenoms = parseChipDenominations(game.chipDenominations);
  const photoMap = await getPlayerPhotoMap();

  // Generate QR codes for all players (server-side, parallel).
  const qrcodes = await Promise.all(
    game.players.map((p) =>
      qrSvgDataUri(`${origin}/play/${p.slug}`).then((src) => ({
        playerId: p.id,
        src,
      }))
    )
  );
  const qrByPlayer = new Map(qrcodes.map((q) => [q.playerId, q.src]));

  const totals = game.players.map((p) => {
    const totalBuyIn = p.buyIns.reduce((s, b) => s + b.amount, 0);
    const net = (p.finalAmount ?? 0) - totalBuyIn;
    return {
      player: p,
      totalBuyIn,
      finalAmount: p.finalAmount ?? null,
      net,
    };
  });

  const sumBuyIns = totals.reduce((s, t) => s + t.totalBuyIn, 0);
  const sumFinal = totals.reduce((s, t) => s + (t.finalAmount ?? 0), 0);
  const allEntered = totals.every((t) => t.finalAmount !== null);
  const balanced = sumBuyIns === sumFinal;
  const discrepancy = sumFinal - sumBuyIns;

  let txns: ReturnType<typeof settle> = [];
  if (game.status === "settled" && allEntered) {
    txns = settle(
      totals.map((t) => ({
        playerId: t.player.id,
        name: t.player.name,
        net: t.net,
      }))
    );
  }

  // WhatsApp share text — every player's link.
  const shareLines = [
    `Pokerpot — ${game.name ?? "Poker night"}`,
    "",
    ...game.players.map((p) => `${p.name}: ${origin}/play/${p.slug}`),
    "",
    "Open your link to enter your final amount.",
  ];
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareLines.join("\n"))}`;

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12">
      {game.status === "settled" && <Confetti seed={game.id} />}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-zinc-50 to-amber-50/50 dark:from-emerald-950/20 dark:via-black dark:to-amber-950/20" />

      <div className="relative z-10 mx-auto w-full max-w-2xl animate-fade-in">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← All games
        </Link>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              {game.name ?? "Game"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Default buy-in {centsToEuros(game.defaultBuyIn)} · status{" "}
              <span className="capitalize">{game.status}</span>
            </p>
          </div>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
          >
            Send links via WhatsApp
          </a>
        </header>

        <AutoRefresh enabled={game.status !== "settled"} />

        {/* QR codes — collapsible, no JS needed (uses native <details>) */}
        <details className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Show QR codes for all players
          </summary>
          <p className="mt-2 text-xs text-zinc-500">
            Have friends scan these from your phone — no typing needed.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {game.players.map((p) => {
              const src = qrByPlayer.get(p.id);
              return (
                <div
                  key={p.id}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {src && (
                    <img
                      src={src}
                      alt={`QR code for ${p.name}`}
                      className="h-32 w-32"
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <Avatar name={p.name} photoMap={photoMap} size="sm" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </details>

        {/* Players + buy-ins ------------------------------------------------ */}
        <section className="mt-8 flex flex-col gap-4">
          {game.players.map((p) => {
            const t = totals.find((x) => x.player.id === p.id)!;
            const url = `${origin}/play/${p.slug}`;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={p.name} photoMap={photoMap} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-black dark:text-zinc-50">
                      {p.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">
                      <a
                        href={url}
                        target="_blank"
                        className="hover:underline"
                      >
                        {url}
                      </a>
                    </div>
                  </div>
                  {game.status === "setup" && (
                    <form action={removePlayer}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <input type="hidden" name="playerId" value={p.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-zinc-500">Buy-ins:</span>
                  {p.buyIns.length === 0 ? (
                    <span className="text-zinc-400">none</span>
                  ) : (
                    p.buyIns.map((b) => (
                      <span
                        key={b.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {centsToEuros(b.amount)}
                        {game.status !== "settled" && (
                          <form action={deleteBuyIn} className="contents">
                            <input
                              type="hidden"
                              name="gameId"
                              value={game.id}
                            />
                            <input
                              type="hidden"
                              name="buyInId"
                              value={b.id}
                            />
                            <button
                              type="submit"
                              className="text-zinc-400 hover:text-red-600"
                              title="Remove this buy-in"
                            >
                              ×
                            </button>
                          </form>
                        )}
                      </span>
                    ))
                  )}
                  <span className="ml-auto text-sm font-medium">
                    Total in: {centsToEuros(t.totalBuyIn)}
                  </span>
                </div>

                {game.status !== "settled" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={rebuy}>
                      <input type="hidden" name="gameId" value={game.id} />
                      <input type="hidden" name="playerId" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-white"
                      >
                        + Rebuy {centsToEuros(game.defaultBuyIn)}
                      </button>
                    </form>
                    <form action={addCustomBuyIn} className="flex gap-2">
                      <input type="hidden" name="gameId" value={game.id} />
                      <input type="hidden" name="playerId" value={p.id} />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Custom €"
                        className="w-24 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                )}

                {/* Cash-out section */}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900">
                  <span className="text-zinc-500">Cash-out:</span>
                  <span className="font-medium">
                    {t.finalAmount === null ? (
                      <span className="text-zinc-400">waiting…</span>
                    ) : (
                      <>
                        {centsToEuros(t.finalAmount)}{" "}
                        <span
                          className={
                            t.net >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          ({t.net >= 0 ? "+" : ""}
                          {centsToEuros(t.net)})
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Chips editor ---------------------------------------------------- */}
        <div className="mt-6">
          <ChipsEditor
            gameId={game.id}
            initial={chipDenoms}
            locked={game.status === "settled"}
          />
        </div>

        {/* Add player (only during setup) ----------------------------------- */}
        {game.status === "setup" && (
          <section className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
            <form action={addPlayer} className="flex gap-2">
              <input type="hidden" name="gameId" value={game.id} />
              <input
                name="name"
                placeholder="Add another player"
                required
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </form>
          </section>
        )}

        {/* Totals + sanity check ------------------------------------------- */}
        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Totals
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-zinc-600 dark:text-zinc-400">Total buy-ins</dt>
            <dd className="text-right font-medium">
              {centsToEuros(sumBuyIns)}
            </dd>
            <dt className="text-zinc-600 dark:text-zinc-400">
              Total cash-outs ({totals.filter((t) => t.finalAmount !== null).length}/{totals.length} entered)
            </dt>
            <dd className="text-right font-medium">
              {centsToEuros(sumFinal)}
            </dd>
          </dl>
          {allEntered && !balanced && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              ⚠ Numbers don&apos;t balance — cash-outs are{" "}
              {centsToEuros(Math.abs(discrepancy))}{" "}
              {discrepancy > 0 ? "more" : "less"} than buy-ins. Double-check
              someone&apos;s amount before settling.
            </p>
          )}
        </section>

        {/* Status controls -------------------------------------------------- */}
        <section className="mt-6 flex flex-wrap gap-2">
          {game.status === "setup" && (
            <form action={setStatus}>
              <input type="hidden" name="gameId" value={game.id} />
              <input type="hidden" name="status" value="cashout" />
              <button
                type="submit"
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Move to cash-out phase →
              </button>
            </form>
          )}
          {game.status === "cashout" && (
            <>
              <form action={setStatus}>
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="status" value="setup" />
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  ← Back to setup
                </button>
              </form>
              <form action={setStatus}>
                <input type="hidden" name="gameId" value={game.id} />
                <input type="hidden" name="status" value="settled" />
                <button
                  type="submit"
                  disabled={!allEntered}
                  className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {allEntered
                    ? "Settle game →"
                    : `Waiting on ${totals.filter((t) => t.finalAmount === null).length}…`}
                </button>
              </form>
            </>
          )}
          {game.status === "settled" && (
            <form action={setStatus}>
              <input type="hidden" name="gameId" value={game.id} />
              <input type="hidden" name="status" value="cashout" />
              <button
                type="submit"
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Reopen game
              </button>
            </form>
          )}
        </section>

        {/* AI recap --------------------------------------------------------- */}
        {game.status === "settled" && game.recap && (
          <section className="mt-8 animate-fade-up rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm dark:border-amber-900/60 dark:from-amber-950 dark:via-zinc-950 dark:to-emerald-950">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              The recap
            </div>
            <p className="mt-2 font-serif text-lg leading-snug text-zinc-800 dark:text-zinc-100">
              {game.recap}
            </p>
          </section>
        )}

        {/* Settlements ------------------------------------------------------ */}
        {game.status === "settled" && (
          <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <h2 className="text-sm font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
              Settlements
            </h2>
            {txns.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">
                Everyone broke even. No payments needed.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {txns.map((t, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-900"
                  >
                    <Avatar name={t.fromName} photoMap={photoMap} size="sm" />
                    <span className="font-medium">{t.fromName}</span>
                    <span className="text-zinc-400">pays</span>
                    <Avatar name={t.toName} photoMap={photoMap} size="sm" />
                    <span className="font-medium">{t.toName}</span>
                    <span className="ml-auto font-mono">
                      {centsToEuros(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Danger zone ------------------------------------------------------ */}
        <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <form action={deleteGame}>
            <input type="hidden" name="gameId" value={game.id} />
            <button
              type="submit"
              className="text-xs text-red-600 hover:text-red-800 dark:text-red-400"
            >
              Delete this game
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
