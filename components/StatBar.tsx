import type { City } from "@/lib/types";
import { averageSentiment } from "@/lib/sentiment";

type StatBarProps = {
  cities: City[];
};

function formatScore(n: number) {
  return n.toFixed(2);
}

export default function StatBar({ cities }: StatBarProps) {
  const n = cities.length;
  const avgGem =
    n === 0 ? 0 : cities.reduce((s, c) => s + c.gemini_sentiment, 0) / n;
  const avgPerp =
    n === 0 ? 0 : cities.reduce((s, c) => s + c.perplexity_sentiment, 0) / n;

  let mostPositive: City | null = null;
  let mostNegative: City | null = null;
  let bestAvg = -Infinity;
  let worstAvg = Infinity;

  for (const c of cities) {
    const a = averageSentiment(c);
    if (a > bestAvg) {
      bestAvg = a;
      mostPositive = c;
    }
    if (a < worstAvg) {
      worstAvg = a;
      mostNegative = c;
    }
  }

  const items = [
    { label: "Cities analysed", value: String(n), hint: "in dataset", accent: false },
    { label: "Avg Gemini", value: formatScore(avgGem), hint: "mean sentiment", accent: false },
    {
      label: "Avg Perplexity",
      value: formatScore(avgPerp),
      hint: "mean sentiment",
      accent: false,
    },
    {
      label: "Most positive",
      value: mostPositive?.city ?? "—",
      hint: mostPositive ? averageSentiment(mostPositive).toFixed(2) : "",
      accent: true,
    },
    {
      label: "Most negative",
      value: mostNegative?.city ?? "—",
      hint: mostNegative ? averageSentiment(mostNegative).toFixed(2) : "",
      accent: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="glass-card rounded-xl px-4 py-3"
        >
          <p
            className={`text-[11px] font-medium uppercase tracking-wider ${
              item.accent ? "text-accent" : "text-black/55"
            }`}
          >
            {item.label}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-black lg:text-2xl">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-xs text-black/50">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
