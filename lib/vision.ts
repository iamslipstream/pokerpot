import Groq from "groq-sdk";
import type { ChipDenomination } from "@/lib/chips";

export type DetectedCounts = Record<string, number>;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Llama 4 Scout — vision model on Groq's free tier. Maverick (bigger) is
// gated to higher tiers; Scout + improved reasoning prompt is the sweet spot.
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// Self-consistency: call N samples in parallel and take the per-color median.
// Small vision models hallucinate counts inconsistently, so this is a cheap
// way to drop the variance without paying for a stronger model.
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

  // Two-step prompt: force the model to *describe what it sees* before
  // committing to a count. Returning structured JSON with intermediate
  // reasoning is far more accurate than asking for counts directly.
  const prompt = `You are counting poker chips in this photo. The colors I care about are: ${colors.join(", ")}.

Respond with ONLY a JSON object in this exact shape:
{
  "observations": "<one short sentence per color: where chips are (loose, in stacks of N, etc.)>",
  "counts": { ${colors.map((c) => `"${c}": <integer>`).join(", ")} }
}

Counting rules — read carefully:
1. Count EVERY visible chip, including those in stacks. For a stack, count by the visible thickness on the side: each chip is roughly the same height as it is thick.
2. If a stack is partially obscured, estimate based on the visible portion.
3. Group chips by color first, then count each group separately.
4. If you're uncertain about a chip's color, pick the closest match from: ${colors.join(", ")}.
5. If a color isn't visible at all, return 0 for that color.
6. Do NOT include any color that isn't in this list: ${colors.join(", ")}.

Be conservative — it's better to undercount slightly than to invent chips that aren't there.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${imageMediaType};base64,${imageBase64}`,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    response_format: { type: "json_object" },
    // Higher temperature than a single-shot call — we want genuinely
    // independent samples to median, not three identical answers.
    temperature: 0.5,
    max_tokens: 512,
  });

  const text = response.choices[0]?.message?.content;
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

  // Accept either { counts: {...} } (preferred) or a flat color->count object.
  const root = parsed as Record<string, unknown>;
  const countsObj =
    typeof root.counts === "object" && root.counts !== null
      ? (root.counts as Record<string, unknown>)
      : root;

  const counts: DetectedCounts = {};
  for (const color of colors) {
    const v = countsObj[color];
    const n = typeof v === "number" ? Math.max(0, Math.round(v)) : 0;
    counts[color] = n;
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
      (r): r is PromiseFulfilledResult<DetectedCounts> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  if (successes.length === 0) {
    // Surface the first failure so the user gets a real error, not a silent zero.
    const firstFailure = settled.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    const reason =
      firstFailure?.reason instanceof Error
        ? firstFailure.reason.message
        : "All vision samples failed";
    throw new Error(reason);
  }

  // Per-color median across whichever samples succeeded.
  const result: DetectedCounts = {};
  for (const color of colors) {
    const values = successes.map((c) => c[color] ?? 0);
    result[color] = median(values);
  }
  return result;
}
