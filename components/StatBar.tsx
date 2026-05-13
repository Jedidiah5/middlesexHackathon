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
    { label: "Cities analysed", value: String(n), hint: "in dataset" },
    { label: "Avg Gemini", value: formatScore(avgGem), hint: "mean sentiment" },
    {
      label: "Avg Perplexity",
      value: formatScore(avgPerp),
      hint: "mean sentiment",
    },
    {
      label: "Most positive",
      value: mostPositive?.city ?? "—",
      hint: mostPositive ? averageSentiment(mostPositive).toFixed(2) : "",
    },
    {
      label: "Most negative",
      value: mostNegative?.city ?? "—",
      hint: mostNegative ? averageSentiment(mostNegative).toFixed(2) : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            {item.label}
          </p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-tight text-neutral-950 lg:text-2xl">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-xs text-neutral-500">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
