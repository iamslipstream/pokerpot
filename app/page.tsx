import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100 via-white to-amber-100 dark:from-emerald-950 dark:via-black dark:to-amber-950" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/30" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-5xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
          Settle the table.
        </h1>
        <p className="mt-6 max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          End-of-night chip math, solved. Track buy-ins, collect cash-outs from
          friends, and Pokerpot tells everyone who pays whom — in the fewest
          transactions possible.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-105 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to dashboard
            </Link>
          ) : (
            <Link
              href="/api/auth/signin?callbackUrl=/dashboard"
              className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:scale-105 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Start a game
            </Link>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Sign in once. Friends just need a link — no account required.
        </p>
      </div>
    </main>
  );
}
