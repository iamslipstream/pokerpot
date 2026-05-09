import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";

export async function SiteHeader() {
  const session = await auth();
  const isAuthed = !!session?.user?.id;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/70 backdrop-blur-md dark:border-zinc-800/60 dark:bg-black/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition hover:opacity-80"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={28}
            height={28}
            className="rounded-full"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-black dark:text-zinc-50">
            Pokerpot
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 sm:flex">
          {isAuthed && (
            <Link
              href="/dashboard"
              className="rounded-full px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/#how-it-works"
            className="rounded-full px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-black dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            How it works
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {isAuthed ? (
            <>
              <Link
                href="/games/new"
                className="hidden rounded-full bg-black px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition hover:scale-[1.03] dark:bg-white dark:text-black sm:inline-block"
              >
                + New game
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/api/auth/signin?callbackUrl=/dashboard"
              className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:scale-[1.03] dark:bg-white dark:text-black"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
