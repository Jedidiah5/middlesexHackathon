"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { City } from "@/lib/types";
import StatBar from "@/components/StatBar";
import WorldMap from "@/components/WorldMap";
import CityPanel from "@/components/CityPanel";
import ComparisonChart from "@/components/ComparisonChart";
import ThemeExplorer from "@/components/ThemeExplorer";

function uniqueThemes(cities: City[]): string[] {
  const set = new Set<string>();
  for (const c of cities) {
    for (const t of c.top_themes) {
      set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [highlightedCity, setHighlightedCity] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/cities_data.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data (${r.status})`);
        return r.json() as Promise<City[]>;
      })
      .then((data) => {
        if (!cancelled) setCities(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load cities_data.json");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mapCities = useMemo(() => {
    if (!activeTheme) return cities;
    return cities.filter((c) => c.top_themes.includes(activeTheme));
  }, [cities, activeTheme]);

  useEffect(() => {
    if (
      selectedCity &&
      !mapCities.some((c) => c.city === selectedCity.city)
    ) {
      setSelectedCity(null);
    }
  }, [mapCities, selectedCity]);

  const themes = useMemo(() => uniqueThemes(cities), [cities]);

  const toggleTheme = useCallback((theme: string) => {
    setActiveTheme((prev) => (prev === theme ? null : theme));
  }, []);

  const handleSelectCity = useCallback((city: City) => {
    setSelectedCity(city);
    setHighlightedCity(city.city);
  }, []);

  const handleBarSelect = useCallback((cityName: string) => {
    setHighlightedCity((prev) => (prev === cityName ? null : cityName));
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCity(null);
  }, []);

  return (
    <>
      {selectedCity ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/[0.12] backdrop-blur-md transition-opacity xl:hidden"
          aria-label="Close city panel"
          onClick={handleClosePanel}
        />
      ) : null}
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col xl:flex-row xl:items-stretch">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-header px-6 py-10 lg:px-10 lg:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl lg:text-5xl">
            Urban Lens
          </h1>
          <p className="mt-3 max-w-2xl text-base text-black sm:text-lg">
            How <span className="font-medium text-accent">AI perceives</span>{" "}
            the world&apos;s cities
          </p>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            Interactive 3D globe with side-by-side sentiment from{" "}
            <span className="font-medium text-accent">Gemini</span> and{" "}
            <span className="font-medium text-accent">Perplexity</span> — static
            export data for this demo.
          </p>
        </header>

        <main className="flex flex-1 flex-col gap-8 px-6 py-8 lg:gap-10 lg:px-10 lg:py-10">
          {loadError ? (
            <div className="glass-card rounded-xl px-4 py-3 text-sm text-black">
              {loadError}
            </div>
          ) : null}

          <StatBar cities={cities} />

          <WorldMap
            cities={mapCities}
            selectedCity={selectedCity}
            highlightedCity={highlightedCity}
            onSelectCity={handleSelectCity}
          />

          <ComparisonChart
            cities={cities}
            highlightedCity={highlightedCity}
            onBarSelect={handleBarSelect}
          />

          <ThemeExplorer
            themes={themes}
            activeTheme={activeTheme}
            onToggleTheme={toggleTheme}
          />

          <footer className="glass-card rounded-xl px-4 py-4 text-xs text-black/60">
            <span className="font-medium text-accent">Static demo</span> — data
            from{" "}
            <code className="glass-chip rounded border border-black/10 px-1.5 py-0.5 font-mono text-[11px] text-black">
              /public/cities_data.json
            </code>
            . Globe textures load from a public CDN (no backend APIs).
          </footer>
        </main>
      </div>

      <CityPanel city={selectedCity} onClose={handleClosePanel} />
    </div>
    </>
  );
}
