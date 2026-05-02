import Groq from "groq-sdk";
import { centsToEuros } from "@/lib/money";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fast text model on Groq's free tier — perfect for one-line recaps.
const MODEL = "llama-3.3-70b-versatile";

export type RecapInput = {
  gameName: string | null;
  results: { name: string; net: number; buyIn: number }[]; // cents
};

export async function generateRecap(input: RecapInput): Promise<string> {
  if (input.results.length === 0) return "";

  const sorted = [...input.results].sort((a, b) => b.net - a.net);
  const lines = sorted
    .map((r) => {
      const net = r.net >= 0 ? `+${centsToEuros(r.net)}` : centsToEuros(r.net);
      return `- ${r.name}: ${net} (bought in ${centsToEuros(r.buyIn)})`;
    })
    .join("\n");

  const prompt = `You are a sportscaster recapping a casual home poker night between friends. Tone: punchy, witty, ESPN-meets-friendly-banter. Roast losses gently, celebrate wins.

Game: ${input.gameName ?? "Poker night"}

Final standings (positive = won money, negative = lost):
${lines}

Write EXACTLY 1-2 sentences (max 240 characters total). Mention the top winner by name. If there's a clear biggest loser, mention them too. Be specific — use real numbers and names. No hashtags. No emoji. No quotes around the recap.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 120,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  // Strip wrapping quotes if model added them despite instructions.
  return text.replace(/^["']|["']$/g, "");
}
