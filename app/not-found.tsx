import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-zinc-50 to-amber-50 dark:from-emerald-950/30 dark:via-black dark:to-amber-950/30" />
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          404
        </span>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
          Folded.
        </h1>
        <p className="mt-4 max-w-md text-base text-zinc-600 dark:text-zinc-400">
          That page is not in the deck. Check the link or head back to the
          table.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-lg shadow-black/15 transition hover:scale-105 dark:bg-white dark:text-black"
          >
            Back home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-zinc-300 bg-white/70 px-6 py-3 text-sm font-medium text-zinc-800 backdrop-blur transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
