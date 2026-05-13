"use client";

import type { City } from "@/lib/types";

type CityPanelProps = {
  city: City | null;
  onClose: () => void;
};

function SentimentTick({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = ((value + 1) / 2) * 100;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-500">{label}</span>
        <span className="font-mono text-neutral-900">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-neutral-400/50 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-neutral-300/50 to-transparent"
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-950 shadow"
          style={{ left: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-950 shadow-md"
          style={{ left: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function CityPanel({ city, onClose }: CityPanelProps) {
  const open = city !== null;

  return (
    <aside
      className={`relative flex shrink-0 flex-col border-neutral-200 bg-white shadow-2xl transition-[width,transform,opacity,border-color] duration-300 ease-out xl:h-auto xl:border-l xl:shadow-sm ${
        open
          ? "pointer-events-auto fixed right-0 top-0 z-50 h-full w-full max-w-[420px] translate-x-0 border-l opacity-100 xl:relative xl:z-auto xl:max-w-none xl:translate-x-0 xl:self-stretch xl:border-l xl:opacity-100 xl:shadow-sm"
          : "pointer-events-none fixed right-0 top-0 z-50 h-full w-full max-w-[420px] translate-x-full border-transparent opacity-0 xl:relative xl:z-auto xl:max-w-none xl:translate-x-0 xl:overflow-hidden xl:border-l-0 xl:opacity-100 xl:shadow-none"
      } ${open ? "xl:w-[420px]" : "xl:w-0 xl:border-l-0"}`}
      aria-hidden={!open}
    >
      {city ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                {city.city}
              </h2>
              <p className="text-sm text-neutral-500">{city.country}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 p-2 text-neutral-500 transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Close panel"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <SentimentTick
              value={city.gemini_sentiment}
              label="Gemini"
              color="#171717"
            />
            <SentimentTick
              value={city.perplexity_sentiment}
              label="Perplexity"
              color="#525252"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 scrollbar-thin">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Model narratives
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="mb-2 text-xs font-semibold text-neutral-950">Gemini</p>
                <p className="text-sm leading-relaxed text-neutral-700">
                  {city.gemini_summary}
                </p>
              </div>
              <div className="rounded-xl border border-neutral-300 bg-neutral-100/60 p-4">
                <p className="mb-2 text-xs font-semibold text-neutral-700">
                  Perplexity
                </p>
                <p className="text-sm leading-relaxed text-neutral-700">
                  {city.perplexity_summary}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Top themes
              </p>
              <div className="flex flex-wrap gap-2">
                {city.top_themes.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
