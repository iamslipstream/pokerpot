"use client";

import { useState } from "react";
import type { ChipDenomination } from "@/lib/chips";
import { chipColorClass } from "@/lib/chips";
import { setChipDenominations } from "./actions";

type Row = { color: string; valueEuros: string };

function toRows(chips: ChipDenomination[]): Row[] {
  return chips.map((c) => ({
    color: c.color,
    valueEuros: (c.value / 100).toFixed(2),
  }));
}

export function ChipsEditor({
  gameId,
  initial,
  locked,
}: {
  gameId: string;
  initial: ChipDenomination[];
  locked: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(
    toRows(initial.length > 0 ? initial : [{ color: "white", value: 25 }])
  );
  const [open, setOpen] = useState(false);

  const total = rows.reduce(
    (s, r) => s + (parseFloat(r.valueEuros) || 0) * 100,
    0
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Chip denominations
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {open ? "Close" : locked ? "View" : "Edit"}
        </button>
      </div>

      {/* Read-only view */}
      {!open && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {initial.length === 0 ? (
            <li className="text-sm text-zinc-500">
              Not configured — friends can&apos;t use photo cash-out yet.
            </li>
          ) : (
            initial.map((c) => (
              <li
                key={c.color}
                className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800"
              >
                <span
                  className={`h-3 w-3 rounded-full ${chipColorClass(c.color)}`}
                />
                <span className="font-medium capitalize">{c.color}</span>
                <span className="text-zinc-500">€{(c.value / 100).toFixed(2)}</span>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Editor */}
      {open && (
        <form
          action={setChipDenominations}
          className="mt-3 flex flex-col gap-2"
        >
          <input type="hidden" name="gameId" value={gameId} />
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className={`h-5 w-5 shrink-0 rounded-full ${chipColorClass(r.color)}`}
              />
              <input
                name="color"
                value={r.color}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((rs) =>
                    rs.map((x, j) => (j === i ? { ...x, color: v } : x))
                  );
                }}
                placeholder="color"
                disabled={locked}
                className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50"
              />
              <span className="text-zinc-400">€</span>
              <input
                name="value"
                value={r.valueEuros}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((rs) =>
                    rs.map((x, j) => (j === i ? { ...x, valueEuros: v } : x))
                  );
                }}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                disabled={locked}
                className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 disabled:opacity-50"
              />
              {!locked && rows.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setRows((rs) => rs.filter((_, j) => j !== i))
                  }
                  className="ml-auto text-xs text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {!locked && (
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setRows((rs) => [...rs, { color: "", valueEuros: "" }])
                }
                className="rounded-full border border-dashed border-zinc-400 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                + Add chip color
              </button>
              <button
                type="submit"
                className="rounded-full bg-black px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Save
              </button>
              <p className="ml-auto text-xs text-zinc-500">
                {rows.length} colors
              </p>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
