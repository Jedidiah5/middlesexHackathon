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

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Server missing ANTHROPIC_API_KEY. Add it to .env.local." },
      { status: 503 },
    );
  }

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

  const context = buildContextBlock(city as City);

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

    return NextResponse.json({ reply: text || "(No text in response.)" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Claude request failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
