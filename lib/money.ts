// All amounts stored as integer cents to avoid float math.

export function eurosToCents(input: string | number): number {
  const n = typeof input === "string" ? Number(input.replace(",", ".")) : input;
  if (!Number.isFinite(n)) throw new Error("Not a number");
  return Math.round(n * 100);
}

export function centsToEuros(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}€${euros}.${remainder.toString().padStart(2, "0")}`;
}
