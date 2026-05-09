import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();
  const ctaHref = session?.user
    ? "/dashboard"
    : "/api/auth/signin?callbackUrl=/dashboard";
  const ctaLabel = session?.user ? "Go to dashboard →" : "Start a game →";

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      {/* ----- Hero ----- */}
      <section className="relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-6 py-24">
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
          <p className="mt-6 max-w-xl animate-fade-up text-lg text-zinc-600 [animation-delay:0.08s] dark:text-zinc-400">
            Track buy-ins, collect cash-outs from friends, and Pokerpot tells
            everyone who pays whom — in the fewest transactions possible.
          </p>

          <div className="mt-10 flex animate-fade-up flex-wrap justify-center gap-3 [animation-delay:0.16s]">
            <Link
              href={ctaHref}
              className="group relative overflow-hidden rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:shadow-xl hover:shadow-black/25 dark:bg-white dark:text-black dark:shadow-white/10"
            >
              <span className="relative z-10">{ctaLabel}</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-zinc-300 bg-white/60 px-6 py-3.5 text-sm font-medium text-zinc-800 backdrop-blur transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              See how it works
            </a>
          </div>

          <p className="mt-6 animate-fade-up text-xs text-zinc-500 [animation-delay:0.24s]">
            Sign in once. Friends just need a link — no account required.
          </p>
        </div>
      </section>

      {/* ----- How it works ----- */}
      <section
        id="how-it-works"
        className="relative border-t border-zinc-200/60 bg-white/60 px-6 py-24 backdrop-blur-sm dark:border-zinc-800/60 dark:bg-zinc-950/40"
      >
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-12 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              Three steps. Zero spreadsheets.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 dark:text-zinc-400">
              From the first chip stack to the last Venmo, Pokerpot keeps the
              math out of the way so you can focus on the cards.
            </p>
          </div>

          <ol className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Start a game",
                body: "Name the night, set the default buy-in, and add players. We generate a private link for each one.",
              },
              {
                step: "02",
                title: "Track buy-ins live",
                body: "Tap to add rebuys as they happen. Players check their own stack from their phone — no math at the table.",
              },
              {
                step: "03",
                title: "Settle automatically",
                body: "Enter final cash-outs and Pokerpot computes the minimum-transaction settlement for everyone.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="card-lift relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="font-mono text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                  {item.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-black dark:text-zinc-50">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----- Why Pokerpot ----- */}
      <section className="relative px-6 py-24">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-12 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
              Why Pokerpot
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              Built for the home game.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "Minimum-transaction settle",
                body: "Instead of everyone paying everyone, we compute the smallest set of payments. Fewer Venmos, no awkwardness.",
              },
              {
                icon: "🔗",
                title: "No-account player links",
                body: "Only the host signs in. Players get a personal link to enter their cash-out — nothing to install.",
              },
              {
                icon: "📊",
                title: "ROI-ranked leaderboard",
                body: "Lifetime stats across every game you host. Ranked by return on buy-in, so the €10 grinder competes fairly.",
              },
              {
                icon: "📷",
                title: "Chip-stack vision",
                body: "Snap a photo of a stack and we read the count. No more squinting at green and black towers.",
              },
              {
                icon: "🤖",
                title: "AI night recap",
                body: "After settlement, get a one-paragraph recap of the swings, comebacks, and biggest pots of the night.",
              },
              {
                icon: "🌒",
                title: "Dark-mode native",
                body: "Designed pixel-by-pixel for the lighting in your kitchen at 2am.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="card-lift rounded-2xl border border-zinc-200 bg-white/80 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80"
              >
                <div className="text-2xl">{feat.icon}</div>
                <h3 className="mt-3 text-base font-semibold text-black dark:text-zinc-50">
                  {feat.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {feat.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----- Final CTA ----- */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-emerald-100/60 via-white to-amber-100/60 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-amber-950/40" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
            Your next home game starts here.
          </h2>
          <p className="mt-4 max-w-lg text-base text-zinc-600 dark:text-zinc-400">
            Free, no ads, no tracking. Sign in with Google and you&apos;re running
            a game in under a minute.
          </p>
          <Link
            href={ctaHref}
            className="group relative mt-8 overflow-hidden rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-lg shadow-black/20 transition hover:scale-105 dark:bg-white dark:text-black"
          >
            <span className="relative z-10">{ctaLabel}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </Link>
        </div>
      </section>
    </main>
  );
}
