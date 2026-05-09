import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-zinc-200/60 bg-white/40 backdrop-blur-md dark:border-zinc-800/60 dark:bg-black/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/icon.svg"
            alt=""
            width={20}
            height={20}
            className="rounded-full opacity-80"
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Pokerpot
          </span>
          <span className="text-zinc-400 dark:text-zinc-600">
            · End-of-night chip math, solved.
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/#how-it-works"
            className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            How it works
          </Link>
          <span className="text-zinc-400 dark:text-zinc-600">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
