"use client";

import { useState } from "react";

export function PlayersField({ recent }: { recent: string[] }) {
  const [value, setValue] = useState("");

  function fillFromRecent() {
    setValue(recent.join("\n"));
  }

  return (
    <div>
      <textarea
        name="players"
        rows={6}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={"Alice\nBob\nCarl\nDave"}
        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          One per line — or comma-separated.
        </p>
        {recent.length > 0 && (
          <button
            type="button"
            onClick={fillFromRecent}
            className="rounded-full border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Use {recent.length} from last game
          </button>
        )}
      </div>
    </div>
  );
}
