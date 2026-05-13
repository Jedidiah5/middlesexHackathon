/** Map sentiment in [-1, 1] to a red → yellow → green colour. */
export function sentimentToColor(score: number): string {
  const t = Math.max(-1, Math.min(1, score));
  const neg = { r: 239, g: 68, b: 68 };
  const neu = { r: 250, g: 204, b: 21 };
  const pos = { r: 34, g: 197, b: 94 };

  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

  let r: number;
  let g: number;
  let b: number;
  if (t <= 0) {
    const u = t + 1;
    r = lerp(neg.r, neu.r, u);
    g = lerp(neg.g, neu.g, u);
    b = lerp(neg.b, neu.b, u);
  } else {
    const u = t;
    r = lerp(neu.r, pos.r, u);
    g = lerp(neu.g, pos.g, u);
    b = lerp(neu.b, pos.b, u);
  }

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

export function averageSentiment(city: {
  gemini_sentiment: number;
  perplexity_sentiment: number;
}): number {
  return (city.gemini_sentiment + city.perplexity_sentiment) / 2;
}

/** Monochrome marker: darker = more negative, lighter = more positive. */
export function sentimentToMono(score: number): string {
  const t = (Math.max(-1, Math.min(1, score)) + 1) / 2;
  const L = Math.round(14 + t * 86);
  return `hsl(0, 0%, ${L}%)`;
}
