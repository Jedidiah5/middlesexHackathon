"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import claudeLogo from "./claudelogo.png";
import type { City, ModelThemeCluster } from "@/lib/types";
import { getSimilarCities } from "@/lib/similarCities";

type CityPanelProps = {
  city: City | null;
  /** Full dataset for “similar cities” (not theme-filtered). */
  cities: City[];
  onSelectCity: (city: City) => void;
  onClose: () => void;
};

function formatPct(n: number): string {
  if (Number.isInteger(n)) return `${n}%`;
  return `${n.toFixed(1)}%`;
}

function SentimentTick({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
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

function KeywordChips({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="text-xs text-black/45">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <span
          key={k}
          className="glass-chip rounded-md border border-black/10 px-2 py-0.5 text-[11px] text-black/85"
        >
          {k}
        </span>
      ))}
    </div>
  );
}

function ClusterRows({
  label,
  rows,
  pctClass,
}: {
  label: string;
  rows: ModelThemeCluster[];
  pctClass: string;
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/25 px-3 py-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
        {label}
      </p>
      <ul className="space-y-2">
        {rows.map((row, i) => (
          <li key={i} className="flex gap-2 border-b border-black/[0.06] pb-2 last:border-0 last:pb-0">
            <span
              className={`shrink-0 tabular-nums font-semibold leading-snug text-black ${pctClass}`}
            >
              {formatPct(row.percentage)}
            </span>
            <span className="min-w-0 text-xs leading-snug text-black/80">{row.theme}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CityPanel({
  city,
  cities,
  onSelectCity,
  onClose,
}: CityPanelProps) {
  const open = city !== null;
  const [geminiSnippet, setGeminiSnippet] = useState("");
  const [perplexitySnippet, setPerplexitySnippet] = useState("");
  const [claudeQuestion, setClaudeQuestion] = useState("");
  const [claudeAnswer, setClaudeAnswer] = useState("");
  const [claudeLoading, setClaudeLoading] = useState(false);

  const similar = useMemo(() => {
    if (!city) return [];
    return getSimilarCities(city, cities, { minOverlap: 1, limit: 6 });
  }, [city, cities]);

  useEffect(() => {
    if (!city?.model_clusters) {
      setGeminiSnippet("");
      setPerplexitySnippet("");
      return;
    }
    const kwG = city.keywords?.gemini ?? [];
    const kwP = city.keywords?.perplexity ?? [];
    const tG = city.model_clusters.gemini.map((c) => c.theme);
    const tP = city.model_clusters.perplexity.map((c) => c.theme);
    const poolG = kwG.length > 0 ? kwG : tG;
    const poolP = kwP.length > 0 ? kwP : tP;
    setGeminiSnippet(poolG.length ? poolG[Math.floor(Math.random() * poolG.length)]! : "");
    setPerplexitySnippet(poolP.length ? poolP[Math.floor(Math.random() * poolP.length)]! : "");
  }, [city?.city, city?.model_clusters, city?.keywords]);

  useEffect(() => {
    setClaudeQuestion("");
    setClaudeAnswer("");
    setClaudeLoading(false);
  }, [city?.city]);

  const askClaude = async () => {
    if (!city || !claudeQuestion.trim()) return;
    setClaudeLoading(true);
    setClaudeAnswer("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: claudeQuestion.trim(), city }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok) {
        setClaudeAnswer(data.error ?? `Request failed (${res.status})`);
        return;
      }
      setClaudeAnswer(data.reply ?? "");
    } catch {
      setClaudeAnswer("Could not reach the chat service. Try again.");
    } finally {
      setClaudeLoading(false);
    }
  };

  const g = city?.model_clusters?.gemini ?? [];
  const p = city?.model_clusters?.perplexity ?? [];
  const rich = Boolean(city?.model_clusters && city.model_clusters.gemini.length);

  return (
    <aside
      className={`flex shrink-0 flex-col glass-card transition-[width,transform,opacity,border-color] duration-300 ease-out max-xl:fixed max-xl:inset-x-0 max-xl:top-0 max-xl:z-50 max-xl:max-h-[min(92dvh,100%)] max-xl:w-full max-xl:overflow-hidden max-xl:border-x-0 max-xl:border-t-0 max-xl:border-b max-xl:rounded-b-2xl max-xl:pt-[max(0px,env(safe-area-inset-top))] xl:h-auto xl:border-l xl:shadow-none ${
        open
          ? "pointer-events-auto max-xl:translate-y-0 max-xl:opacity-100 xl:relative xl:z-auto xl:h-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:self-stretch xl:border-l xl:opacity-100 xl:shadow-sm"
          : "pointer-events-none max-xl:-translate-y-full max-xl:opacity-0 xl:relative xl:z-auto xl:max-w-none xl:translate-x-0 xl:translate-y-0 xl:overflow-hidden xl:border-l-0 xl:opacity-100 xl:shadow-none"
      } ${open ? "xl:w-[460px]" : "xl:w-0 xl:translate-x-0 xl:border-l-0"}`}
      aria-hidden={!open}
    >
      {city ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-black">{city.city}</h2>
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

          {similar.length > 0 ? (
            <div className="border-b border-black/10 px-5 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black/50">
                Similar cities <span className="font-normal normal-case text-black/40">(shared tags)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {similar.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => onSelectCity(c)}
                    className="glass-chip max-w-full truncate rounded-lg border border-black/10 px-2.5 py-1 text-left text-xs font-medium text-black transition hover:border-accent/40 hover:bg-white/40 hover:text-accent"
                  >
                    {c.city}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 border-b border-black/10 px-5 py-3">
            <SentimentTick value={city.gemini_sentiment} label="Gemini" color="#171717" />
            <SentimentTick value={city.perplexity_sentiment} label="Perplexity" color="#525252" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3 scrollbar-thin">
              {rich ? (
                <>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="glass-card--dense rounded-xl p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-accent">Gemini</p>
                      <p className="text-sm font-medium leading-snug text-black">&ldquo;{geminiSnippet}&rdquo;</p>
                    </div>
                    <div className="glass-card--dense rounded-xl p-3">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/55">
                        Perplexity
                      </p>
                      <p className="text-sm font-medium leading-snug text-black">&ldquo;{perplexitySnippet}&rdquo;</p>
                    </div>
                  </div>

                  {city.interesting_insight ? (
                    <div className="mt-4 rounded-xl border border-black/10 bg-white/30 px-4 py-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">
                        Interesting insight
                      </p>
                      <p className="text-sm leading-relaxed text-black/85">{city.interesting_insight}</p>
                    </div>
                  ) : null}

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">Gemini · top share</p>
                      <p className="mt-1 text-5xl font-bold tabular-nums leading-none tracking-tight text-black sm:text-6xl">
                        {g[0] ? formatPct(g[0].percentage) : "—"}
                      </p>
                      <p className="mt-2 text-xs leading-snug text-black/75">{g[0]?.theme}</p>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-black/55">
                        Perplexity · top share
                      </p>
                      <p className="mt-1 text-5xl font-bold tabular-nums leading-none tracking-tight text-black sm:text-6xl">
                        {p[0] ? formatPct(p[0].percentage) : "—"}
                      </p>
                      <p className="mt-2 text-xs leading-snug text-black/75">{p[0]?.theme}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <ClusterRows label="Gemini themes" rows={g} pctClass="text-2xl font-bold tabular-nums w-[4.25rem] shrink-0" />
                    <ClusterRows
                      label="Perplexity themes"
                      rows={p}
                      pctClass="text-2xl font-bold tabular-nums w-[4.25rem] shrink-0"
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
                        Gemini keywords
                      </p>
                      <KeywordChips items={city.keywords?.gemini ?? []} emptyLabel="No keywords listed." />
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">
                        Perplexity keywords
                      </p>
                      <KeywordChips items={city.keywords?.perplexity ?? []} emptyLabel="No keywords listed." />
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">
                        Shared keywords
                      </p>
                      <KeywordChips items={city.keywords?.shared ?? []} emptyLabel="No shared keywords." />
                    </div>
                  </div>

                  <div className="mt-6 pb-2">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">
                      Website tags
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
                </>
              ) : (
                <>
                  <div className="mt-4 space-y-4">
                    <div className="glass-card--dense rounded-xl p-4">
                      <p className="mb-2 text-xs font-semibold text-accent">Gemini</p>
                      <p className="text-sm leading-relaxed text-black/80">{city.gemini_summary}</p>
                    </div>
                    <div className="glass-card--dense rounded-xl p-4">
                      <p className="mb-2 text-xs font-semibold text-accent">Perplexity</p>
                      <p className="text-sm leading-relaxed text-black/80">{city.perplexity_summary}</p>
                    </div>
                  </div>
                  <div className="mt-6 pb-2">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-black/55">Themes</p>
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
                </>
              )}
            </div>

            <div className="shrink-0 border-t border-black/10 bg-white/25 px-5 py-4 backdrop-blur-md">
              <div className="flex items-start gap-2.5">
                <Image
                  src={claudeLogo}
                  alt="Claude"
                  width={32}
                  height={32}
                  className="mt-0.5 h-8 w-8 shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold tracking-tight text-black">Ask Claude</h3>
                  <p className="mt-1 text-xs text-black/55">Ask Claude about this city</p>
                </div>
              </div>
              <textarea
                className="mt-3 w-full resize-none rounded-lg border border-black/15 bg-white/50 p-3 text-sm text-black shadow-inner placeholder:text-black/35 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
                rows={2}
                placeholder="Why is this city described this way?"
                value={claudeQuestion}
                onChange={(e) => setClaudeQuestion(e.target.value)}
                disabled={claudeLoading}
                aria-label="Question for Claude"
              />
              <button
                type="button"
                onClick={askClaude}
                disabled={claudeLoading || !claudeQuestion.trim()}
                className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claudeLoading ? "Thinking..." : "Send"}
              </button>
              {claudeAnswer ? (
                <div
                  key={claudeAnswer.slice(0, 120)}
                  className="animate-fade-in mt-3 rounded-lg border border-black/10 bg-white/45 p-3 text-sm leading-relaxed text-black/85 shadow-sm"
                >
                  {claudeAnswer}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
