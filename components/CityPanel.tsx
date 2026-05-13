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
        <span className="font-medium text-black/60">{label}</span>
        <span className="font-mono text-black">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full glass-chip border-black/10">
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-black/10 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-black/8 to-transparent"
          aria-hidden
        />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow"
          style={{ left: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black shadow-md"
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
      className={`flex shrink-0 flex-col glass-card transition-[width,transform,opacity,border-color] duration-300 ease-out max-xl:fixed max-xl:inset-x-0 max-xl:top-0 max-xl:z-50 max-xl:max-h-[min(92dvh,100%)] max-xl:w-full max-xl:overflow-hidden max-xl:border-x-0 max-xl:border-t-0 max-xl:border-b max-xl:rounded-b-2xl max-xl:pt-[max(0px,env(safe-area-inset-top))] xl:h-auto xl:border-l xl:shadow-none ${
        open
          ? "pointer-events-auto max-xl:translate-y-0 max-xl:opacity-100 xl:relative xl:z-auto xl:h-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:self-stretch xl:border-l xl:opacity-100 xl:shadow-sm"
          : "pointer-events-none max-xl:-translate-y-full max-xl:opacity-0 xl:relative xl:z-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:overflow-hidden xl:border-l-0 xl:opacity-100 xl:shadow-none"
      } ${open ? "xl:w-[420px]" : "xl:w-0 xl:translate-x-0 xl:border-l-0"}`}
      aria-hidden={!open}
    >
      {city ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-black">
                {city.city}
              </h2>
              <p className="text-sm text-black/60">{city.country}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="glass-chip rounded-lg border-black/10 p-2 text-black/50 transition hover:border-black/20 hover:bg-white/30 hover:text-black"
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
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-accent">
              Model narratives
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-card--dense rounded-xl p-4">
                <p className="mb-2 text-xs font-semibold text-accent">Gemini</p>
                <p className="text-sm leading-relaxed text-black/80">
                  {city.gemini_summary}
                </p>
              </div>
              <div className="glass-card--dense rounded-xl p-4">
                <p className="mb-2 text-xs font-semibold text-accent">
                  Perplexity
                </p>
                <p className="text-sm leading-relaxed text-black/80">
                  {city.perplexity_summary}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">
                Top themes
              </p>
              <div className="flex flex-wrap gap-2">
                {city.top_themes.map((t) => (
                  <span
                    key={t}
                    className="glass-chip rounded-full border-black/10 px-3 py-1 text-xs text-black"
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
