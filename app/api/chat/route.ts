import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { City } from "@/lib/types";

function formatClusters(
  label: string,
  rows: { theme: string; percentage: number }[] | undefined,
): string {
  if (!rows?.length) return "";
  return `${label}: ${rows
    .map((r) => `${r.theme} (${Number(r.percentage).toFixed(1)}%)`)
    .join("; ")}`;
}

function buildContextBlock(city: City): string {
  const parts = [
    `City: ${city.city}`,
    `Country: ${city.country}`,
    `Gemini sentiment score: ${city.gemini_sentiment} (scale: -1 very negative to +1 very positive)`,
    `Perplexity sentiment score: ${city.perplexity_sentiment}`,
    `Gemini summary / label: ${city.gemini_summary}`,
    `Perplexity summary / label: ${city.perplexity_summary}`,
    `Top themes (website tags): ${city.top_themes.join(", ")}`,
  ];
  if (city.interesting_insight) {
    parts.push(`Interesting insight: ${city.interesting_insight}`);
  }
  const g = formatClusters("Gemini theme clusters", city.model_clusters?.gemini);
  const p = formatClusters("Perplexity theme clusters", city.model_clusters?.perplexity);
  if (g) parts.push(g);
  if (p) parts.push(p);
  if (city.keywords?.gemini?.length) {
    parts.push(`Gemini keywords: ${city.keywords.gemini.join(", ")}`);
  }
  if (city.keywords?.perplexity?.length) {
    parts.push(`Perplexity keywords: ${city.keywords.perplexity.join(", ")}`);
  }
  if (city.keywords?.shared?.length) {
    parts.push(`Shared keywords: ${city.keywords.shared.join(", ")}`);
  }
  return parts.join("\n");
}

/** Canned analyst-style copy for demos when Claude API is off or forced dummy. */
function buildDummyReply(message: string, city: City): string {
  const tags = city.top_themes.slice(0, 4).join(", ") || "(no tags)";
  const gap = (city.gemini_sentiment - city.perplexity_sentiment).toFixed(2);
  const q =
    message.length > 120 ? `${message.slice(0, 117).trim()}…` : message;
  const topG = city.model_clusters?.gemini?.[0]?.theme;
  const topP = city.model_clusters?.perplexity?.[0]?.theme;

  const lines = [
    `[Demo reply — not live Claude] Here is a placeholder bias read for ${city.city}, ${city.country}.`,
    "",
    `Your question: “${q}”`,
    "",
    `From the static bundle: Gemini scores ${city.gemini_sentiment.toFixed(2)} vs Perplexity ${city.perplexity_sentiment.toFixed(2)} (difference ${gap}). Shared website tags include ${tags}.`,
  ];
  if (topG || topP) {
    lines.push(
      `Dominant cluster themes read as: ${topG ? `Gemini — ${topG}` : "Gemini — (n/a)"}; ${topP ? `Perplexity — ${topP}` : "Perplexity — (n/a)"}.`,
    );
  }
  lines.push(
    "Watch for stereotype risk: both corpora lean on sensory overload (heat, dust, markets) that can flatten local class and politics. Set ANTHROPIC_API_KEY and CLAUDE_USE_DUMMY=0 (or unset dummy) to get a real model answer under 150 words.",
  );
  return lines.join("\n");
}

function useDummyClaude(): boolean {
  if (process.env.CLAUDE_USE_DUMMY === "1") return true;
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return true;
  return false;
}

export async function POST(req: NextRequest) {
  let body: { message?: string; city?: City };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const city = body.city;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (
    !city ||
    typeof city.city !== "string" ||
    typeof city.country !== "string" ||
    typeof city.gemini_sentiment !== "number"
  ) {
    return NextResponse.json({ error: "Valid city payload is required" }, { status: 400 });
  }

  const cityTyped = city as City;

  if (useDummyClaude()) {
    return NextResponse.json({
      reply: buildDummyReply(message, cityTyped),
      dummy: true,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY!.trim();
  const context = buildContextBlock(cityTyped);

  const systemPrompt = `You are an AI bias analyst. A user is exploring how two AI models — Gemini and Perplexity — describe cities around the world.

Here is the data for the city they are currently viewing:

${context}

Answer the user's question analytically. Reference the actual data above. Keep answers under 150 words. Flag any potential bias, stereotype, or inequality you notice in how the models describe this place.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    let text = "";
    for (const block of response.content) {
      if (block.type === "text") {
        text += block.text;
      }
    }

    return NextResponse.json({ reply: text || "(No text in response.)", dummy: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
