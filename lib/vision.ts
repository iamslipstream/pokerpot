import { GoogleGenAI } from "@google/genai";
import type { ChipDenomination } from "@/lib/chips";

export type DetectedCounts = Record<string, number>;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Gemini 2.5 Flash — significantly stronger than Llama 4 Scout at counting,
// available on Google AI Studio's free tier (15 RPM, 1M tok/day).
const MODEL = "gemini-2.5-flash";

// Self-consistency: call N samples in parallel, take per-color median.
// Even with a stronger model, medianing independent samples knocks out
// the residual count-noise on stacks.
const SAMPLES = 3;

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

async function detectOnce(
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  denominations: ChipDenomination[]
): Promise<DetectedCounts> {
  const colors = denominations.map((d) => d.color);

  const prompt = `You are counting poker chips in this photo. The colors I care about are: ${colors.join(", ")}.

Respond with ONLY a JSON object in this exact shape:
{
  "groups": [
    { "color": "<one of: ${colors.join(", ")}>", "where": "<short description: loose pile, stack of 8, etc.>", "count": <integer> }
  ],
  "counts": { ${colors.map((c) => `"${c}": <integer>`).join(", ")} }
}

Counting rules — read carefully:
1. Identify EVERY distinct group of chips you can see (a stack, a loose pile, scattered singles). Each group goes in "groups".
2. For a stack viewed from the side, count chips by the visible thickness — each chip is roughly the same height as it is thick. If a stack is partially obscured, estimate from the visible portion.
3. For each color in "counts", sum the counts of all groups of that color. Counts must equal the sum of group counts of the same color.
4. If you're uncertain about a chip's color, pick the closest match from: ${colors.join(", ")}.
5. If a color isn't visible at all, return 0 for that color.
6. Do NOT include any color that isn't in this list: ${colors.join(", ")}.

Be conservative — it's better to undercount slightly than to invent chips that aren't there.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: imageMediaType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.5,
      // Gemini 2.5 Flash burns "thinking" tokens before emitting output;
      // those count against maxOutputTokens, which truncated our JSON.
      // We get reasoning via the explicit `groups` field in the prompt,
      // so disabling thinking is both faster and avoids the truncation.
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from vision model");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.trim());
  } catch {
    throw new Error(`Vision returned non-JSON: ${text.slice(0, 120)}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Vision returned a non-object");
  }

  // Prefer the explicit `counts` map; fall back to summing `groups`; finally
  // accept a flat color->count map if the model skipped both.
  const root = parsed as Record<string, unknown>;
  const counts: DetectedCounts = {};

  const countsObj =
    typeof root.counts === "object" && root.counts !== null
      ? (root.counts as Record<string, unknown>)
      : null;

  if (countsObj) {
    for (const color of colors) {
      const v = countsObj[color];
      counts[color] = typeof v === "number" ? Math.max(0, Math.round(v)) : 0;
    }
    return counts;
  }

  if (Array.isArray(root.groups)) {
    for (const color of colors) counts[color] = 0;
    for (const g of root.groups as Array<Record<string, unknown>>) {
      const color = typeof g.color === "string" ? g.color.toLowerCase() : "";
      const c = typeof g.count === "number" ? Math.max(0, Math.round(g.count)) : 0;
      if (color in counts) counts[color] += c;
    }
    return counts;
  }

  // Flat shape fallback
  for (const color of colors) {
    const v = root[color];
    counts[color] = typeof v === "number" ? Math.max(0, Math.round(v)) : 0;
  }
  return counts;
}

export async function detectChipsFromImage(
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  denominations: ChipDenomination[]
): Promise<DetectedCounts> {
  const colors = denominations.map((d) => d.color);

  const settled = await Promise.allSettled(
    Array.from({ length: SAMPLES }, () =>
      detectOnce(imageBase64, imageMediaType, denominations)
    )
  );

  const successes = settled
    .filter(
      (r): r is PromiseFulfilledResult<DetectedCounts> =>
        r.status === "fulfilled"
    )
    .map((r) => r.value);

  if (successes.length === 0) {
    const firstFailure = settled.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    const reason =
      firstFailure?.reason instanceof Error
        ? firstFailure.reason.message
        : "All vision samples failed";
    throw new Error(reason);
  }

  const result: DetectedCounts = {};
  for (const color of colors) {
    const values = successes.map((c) => c[color] ?? 0);
    result[color] = median(values);
  }
  return result;
}
