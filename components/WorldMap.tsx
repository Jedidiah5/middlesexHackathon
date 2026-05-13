"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/types";

const UrbanGlobe = dynamic(() => import("./UrbanGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
      <p className="text-sm text-neutral-500">Loading 3D globe…</p>
    </div>
  ),
});

type WorldMapProps = {
  cities: City[];
  selectedCity: City | null;
  highlightedCity: string | null;
  onSelectCity: (city: City) => void;
};

export default function WorldMap({
  cities,
  selectedCity,
  highlightedCity,
  onSelectCity,
}: WorldMapProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="w-full p-1 sm:p-2">
        <UrbanGlobe
          cities={cities}
          selectedCity={selectedCity}
          highlightedCity={highlightedCity}
          onSelectCity={onSelectCity}
        />
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex max-w-[min(100%,280px)] flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white/90 px-3 py-2 text-[10px] text-neutral-600 shadow-sm backdrop-blur-sm">
        <span className="flex items-center gap-2">
          <span className="h-2 w-7 rounded-full bg-gradient-to-r from-neutral-900 via-neutral-400 to-neutral-100 ring-1 ring-neutral-300" />
          Sentiment
        </span>
        <span className="hidden text-neutral-400 sm:inline">|</span>
        <span className="hidden sm:inline">Darker → lighter (avg)</span>
      </div>
      <p className="pointer-events-none absolute right-4 top-4 rounded-md border border-neutral-200 bg-white/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500 shadow-sm backdrop-blur-sm">
        Drag to orbit · scroll to zoom
      </p>
    </div>
  );
}
