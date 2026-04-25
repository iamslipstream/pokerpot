import Groq from "groq-sdk";
import type { ChipDenomination } from "@/lib/chips";

export type DetectedCounts = Record<string, number>;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Llama 4 Scout — fast vision model on Groq's free tier.
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function detectChipsFromImage(
  imageBase64: string,
  imageMediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
  denominations: ChipDenomination[]
): Promise<DetectedCounts> {
  const colors = denominations.map((d) => d.color);
  const prompt = `You are looking at a photo of poker chips. Count how many chips of EACH color are visible. The colors I care about are: ${colors.join(", ")}. Chips may overlap or be stacked — estimate stacks by visible chip thickness on the side of the stack.

Respond with ONLY a JSON object mapping each color to its integer count, no prose, no markdown. Use exactly these keys: ${colors.map((c) => JSON.stringify(c)).join(", ")}. If a color isn't visible, return 0 for it.

Example: {"white": 12, "red": 8, "blue": 3, "green": 0}`;

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
    max_tokens: 256,
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

  const counts: DetectedCounts = {};
  for (const color of colors) {
    const v = (parsed as Record<string, unknown>)[color];
    const n = typeof v === "number" ? Math.max(0, Math.round(v)) : 0;
    counts[color] = n;
  }
  return counts;
}
