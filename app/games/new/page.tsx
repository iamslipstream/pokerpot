import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createGame } from "./actions";
import { PlayersField } from "./PlayersField";

export default async function NewGamePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin?callbackUrl=/games/new");
  }

  const lastGame = await prisma.game.findFirst({
    where: { hostId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      players: {
        select: { name: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const recentPlayers = lastGame ? lastGame.players.map((p) => p.name) : [];

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          New game
        </h1>

        <form action={createGame} className="mt-8 flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Game name (optional)
            </label>
            <input
              name="name"
              placeholder="Tuesday Night Poker"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Default buy-in (€)
            </label>
            <input
              name="defaultBuyIn"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                lastGame ? (lastGame.defaultBuyIn / 100).toFixed(2) : "20"
              }
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Each player starts with one buy-in at this amount. You can rebuy
              or add custom amounts later.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Players
            </label>
            <div className="mt-1">
              <PlayersField recent={recentPlayers} />
            </div>
          </div>

          <button
            type="submit"
            className="self-start rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Create game
          </button>
        </form>
      </div>
    </main>
  );
}
