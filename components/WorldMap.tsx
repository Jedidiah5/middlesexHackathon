"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/types";

const UrbanGlobe = dynamic(() => import("./UrbanGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-2xl border border-black/10 bg-white">
      <p className="text-sm text-black/60">
        Loading <span className="font-medium text-accent">3D globe</span>…
      </p>
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
    <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="w-full p-1 sm:p-2">
        <UrbanGlobe
          cities={cities}
          selectedCity={selectedCity}
          highlightedCity={highlightedCity}
          onSelectCity={onSelectCity}
        />
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex max-w-[min(100%,280px)] flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-[10px] text-black/70 shadow-sm">
        <span className="flex items-center gap-2">
          <span className="h-2 w-7 rounded-full bg-gradient-to-r from-black via-black/40 to-black/10 ring-1 ring-black/10" />
          <span className="font-medium text-accent">Sentiment</span>
        </span>
        <span className="hidden text-black/30 sm:inline">|</span>
        <span className="hidden text-black/55 sm:inline">Darker → lighter (avg)</span>
      </div>
      <p className="pointer-events-none absolute right-4 top-4 rounded-md border border-black/10 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-black/50 shadow-sm">
        Drag to orbit · scroll to zoom
      </p>
    </div>
  );
}
