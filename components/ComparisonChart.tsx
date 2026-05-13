"use client";

import type { City } from "@/lib/types";
import { averageSentiment } from "@/lib/sentiment";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = {
  city: string;
  gemini_sentiment: number;
  perplexity_sentiment: number;
  avg: number;
};

type ComparisonChartProps = {
  cities: City[];
  highlightedCity: string | null;
  onBarSelect: (cityName: string) => void;
};

export default function ComparisonChart({
  cities,
  highlightedCity,
  onBarSelect,
}: ComparisonChartProps) {
  const data: Row[] = [...cities]
    .map((c) => ({
      city: c.city,
      gemini_sentiment: c.gemini_sentiment,
      perplexity_sentiment: c.perplexity_sentiment,
      avg: averageSentiment(c),
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm lg:p-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-950">
            Gemini vs Perplexity
          </h3>
          <p className="text-sm text-neutral-600">
            Sentiment by city (click a bar to highlight on the globe)
          </p>
        </div>
        <div className="flex gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-gemini" /> Gemini
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-perplexity" /> Perplexity
          </span>
        </div>
      </div>
      <div
        className="w-full"
        style={{ height: `${Math.min(540, 120 + data.length * 44)}px` }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            barCategoryGap={18}
            barGap={6}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" horizontal={false} />
            <XAxis
              type="number"
              domain={[-1, 1]}
              tickCount={9}
              stroke="#a3a3a3"
              tick={{ fill: "#525252", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="city"
              width={88}
              stroke="#a3a3a3"
              tick={{ fill: "#171717", fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e5e5",
                borderRadius: "10px",
                fontSize: "12px",
                boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
              }}
              labelStyle={{ color: "#0a0a0a", fontWeight: 600 }}
            />
            <Bar
              dataKey="gemini_sentiment"
              name="Gemini"
              fill="#171717"
              radius={[0, 4, 4, 0]}
              onClick={(_: unknown, index: number) => {
                const row = data[index];
                if (row) onBarSelect(row.city);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={`g-${entry.city}`}
                  fill={
                    highlightedCity === entry.city ? "#262626" : "#171717"
                  }
                  className="cursor-pointer"
                />
              ))}
            </Bar>
            <Bar
              dataKey="perplexity_sentiment"
              name="Perplexity"
              fill="#525252"
              radius={[0, 4, 4, 0]}
              onClick={(_: unknown, index: number) => {
                const row = data[index];
                if (row) onBarSelect(row.city);
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={`p-${entry.city}`}
                  fill={
                    highlightedCity === entry.city ? "#737373" : "#525252"
                  }
                  className="cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
