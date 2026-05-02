import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-zinc-50 to-amber-50 dark:from-emerald-950/40 dark:via-black dark:to-amber-950/40" />
      <div className="pointer-events-none absolute -top-32 left-1/4 h-[28rem] w-[28rem] -translate-x-1/2 animate-drift rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-700/25" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[26rem] w-[26rem] translate-x-1/2 animate-drift rounded-full bg-amber-300/40 blur-3xl dark:bg-amber-700/20 [animation-delay:-9s]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="mb-6 inline-flex animate-fade-in items-center gap-2 rounded-full border border-zinc-200/80 bg-white/60 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/60 dark:text-zinc-300">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          End-of-night chip math, solved
        </span>

        <h1 className="animate-fade-up text-5xl font-semibold tracking-tight sm:text-7xl">
          <span className="text-gradient">Settle the table.</span>
        </h1>
        <p className="mt-6 max-w-md animate-fade-up text-lg text-zinc-600 [animation-delay:0.08s] dark:text-zinc-400">
          Track buy-ins, collect cash-outs from friends, and Pokerpot tells
          everyone who pays whom — in the fewest transactions possible.
        </p>

        <div className="mt-10 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:0.16s]">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="group relative overflow-hidden rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:shadow-xl hover:shadow-black/25 dark:bg-white dark:text-black dark:shadow-white/10"
            >
              <span className="relative z-10">Go to dashboard →</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          ) : (
            <Link
              href="/api/auth/signin?callbackUrl=/dashboard"
              className="group relative overflow-hidden rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:shadow-xl hover:shadow-black/25 dark:bg-white dark:text-black dark:shadow-white/10"
            >
              <span className="relative z-10">Start a game →</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          )}
        </div>

        <p className="mt-6 animate-fade-up text-xs text-zinc-500 [animation-delay:0.24s]">
          Sign in once. Friends just need a link — no account required.
        </p>
      </div>
    </main>
  );
}
