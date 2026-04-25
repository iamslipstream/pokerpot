"use client";

import { useState, useTransition } from "react";
import type { ChipDenomination } from "@/lib/chips";
import { chipColorClass } from "@/lib/chips";
import { centsToEuros } from "@/lib/money";
import { detectChipsFromPhoto, submitFinalAmount } from "./actions";

type Mode = "manual" | "photo";

export function CashoutEntry({
  slug,
  denominations,
  initialAmount, // cents or null
}: {
  slug: string;
  denominations: ChipDenomination[];
  initialAmount: number | null;
}) {
  const hasChips = denominations.length > 0;

  const [mode, setMode] = useState<Mode>("manual");
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(denominations.map((d) => [d.color, 0]))
  );
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [pendingSubmit, startSubmit] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const photoTotalCents = denominations.reduce(
    (s, d) => s + (counts[d.color] ?? 0) * d.value,
    0
  );

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setDetectError("Image too big (max 5MB). Try retaking.");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setDetectError(null);
    setDetecting(true);
    try {
      const fd = new FormData();
      fd.append("slug", slug);
      fd.append("image", file);
      const result = await detectChipsFromPhoto(fd);
      setCounts((prev) => ({ ...prev, ...result.counts }));
    } catch (err) {
      setDetectError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setDetecting(false);
    }
  }

  function adjust(color: string, delta: number) {
    setCounts((c) => ({
      ...c,
      [color]: Math.max(0, (c[color] ?? 0) + delta),
    }));
  }

  function handleSubmitManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    const fd = new FormData(e.currentTarget);
    startSubmit(async () => {
      try {
        await submitFinalAmount(fd);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Submit failed");
      }
    });
  }

  function handleSubmitPhoto() {
    setSubmitError(null);
    const fd = new FormData();
    fd.append("slug", slug);
    fd.append("finalAmount", (photoTotalCents / 100).toFixed(2));
    startSubmit(async () => {
      try {
        await submitFinalAmount(fd);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Submit failed");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <h2 className="text-sm font-medium text-black dark:text-zinc-50">
        {initialAmount === null
          ? "Enter your final amount"
          : "Update your final amount"}
      </h2>

      {hasChips && (
        <div className="mt-3 inline-flex rounded-full border border-zinc-300 p-0.5 text-xs dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`rounded-full px-3 py-1 ${
              mode === "manual"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            Type amount
          </button>
          <button
            type="button"
            onClick={() => setMode("photo")}
            className={`rounded-full px-3 py-1 ${
              mode === "photo"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            📷 Count chips
          </button>
        </div>
      )}

      {/* Manual entry */}
      {mode === "manual" && (
        <form onSubmit={handleSubmitManual} className="mt-3 flex gap-2">
          <input type="hidden" name="slug" value={slug} />
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              €
            </span>
            <input
              name="finalAmount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={
                initialAmount !== null
                  ? (initialAmount / 100).toFixed(2)
                  : ""
              }
              placeholder="0.00"
              className="block w-full rounded-lg border border-zinc-300 bg-white pl-7 pr-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            disabled={pendingSubmit}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pendingSubmit ? "..." : initialAmount === null ? "Submit" : "Update"}
          </button>
        </form>
      )}

      {/* Photo flow */}
      {mode === "photo" && hasChips && (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-800">
            <span className="text-2xl">📷</span>
            <span>
              {previewUrl ? "Retake photo" : "Tap to take or upload a photo"}
            </span>
            <span className="text-xs text-zinc-500">
              Spread chips out by color for best results.
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              className="hidden"
            />
          </label>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Your chips"
              className="max-h-48 w-full rounded-lg object-contain"
            />
          )}

          {detecting && (
            <p className="text-center text-sm text-zinc-500">
              Counting chips with AI…
            </p>
          )}
          {detectError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
              {detectError}
            </p>
          )}

          {/* Editable count grid */}
          {!detecting && (
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Chip counts (edit if needed)
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {denominations.map((d) => (
                  <li
                    key={d.color}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-4 w-4 rounded-full ${chipColorClass(
                          d.color
                        )}`}
                      />
                      <span className="capitalize">{d.color}</span>
                      <span className="text-xs text-zinc-500">
                        × {centsToEuros(d.value)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => adjust(d.color, -1)}
                        className="h-7 w-7 rounded-full border border-zinc-300 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={counts[d.color] ?? 0}
                        onChange={(e) =>
                          setCounts((c) => ({
                            ...c,
                            [d.color]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-14 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <button
                        type="button"
                        onClick={() => adjust(d.color, +1)}
                        className="h-7 w-7 rounded-full border border-zinc-300 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                      >
                        +
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-baseline justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Total
                </span>
                <span className="text-xl font-semibold">
                  {centsToEuros(photoTotalCents)}
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmitPhoto}
            disabled={pendingSubmit || photoTotalCents === 0}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pendingSubmit
              ? "Submitting…"
              : `Confirm ${centsToEuros(photoTotalCents)}`}
          </button>
        </div>
      )}

      {submitError && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
          {submitError}
        </p>
      )}

      {initialAmount !== null && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
          ✓ You entered {centsToEuros(initialAmount)} — you can update it
          until the host settles the game.
        </p>
      )}
    </section>
  );
}
