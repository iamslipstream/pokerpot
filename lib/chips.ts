// Chip denomination types and defaults.

export type ChipDenomination = {
  color: string; // user-friendly: "white", "red", "blue", "green", "black"
  value: number; // cents
};

export const DEFAULT_CHIPS: ChipDenomination[] = [
  { color: "white", value: 25 }, // €0.25
  { color: "red", value: 100 }, // €1
  { color: "blue", value: 500 }, // €5
  { color: "green", value: 2500 }, // €25
];

export function parseChipDenominations(raw: unknown): ChipDenomination[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is { color: string; value: number } =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as { color: unknown }).color === "string" &&
        typeof (c as { value: unknown }).value === "number"
    )
    .map((c) => ({ color: c.color, value: c.value }));
}

// Tailwind class for the color circle. Conservative palette matching common
// poker chip colors. Falls back to zinc for anything unrecognized.
export function chipColorClass(color: string): string {
  const c = color.toLowerCase().trim();
  switch (c) {
    case "white":
      return "bg-zinc-100 ring-1 ring-zinc-300";
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    case "green":
      return "bg-emerald-500";
    case "black":
      return "bg-zinc-900";
    case "yellow":
      return "bg-yellow-400";
    case "orange":
      return "bg-orange-500";
    case "purple":
    case "violet":
      return "bg-violet-500";
    case "pink":
      return "bg-pink-400";
    case "gray":
    case "grey":
      return "bg-zinc-400";
    default:
      return "bg-zinc-400";
  }
}
