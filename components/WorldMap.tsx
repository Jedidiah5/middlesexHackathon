"use client";

import dynamic from "next/dynamic";
import type { City } from "@/lib/types";

const UrbanGlobe = dynamic(() => import("./UrbanGlobe"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[min(52vh,360px)] w-full items-center justify-center lg:min-h-[min(76vh,720px)]">
      <p className="text-sm text-black/55">
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
    <section
      aria-label="Interactive globe"
      className="relative w-full overflow-visible px-6 pb-10 pt-1 lg:px-10"
    >
      {/* No card chrome — soft levitation shadow only */}
      <div className="relative mx-auto max-w-[min(100%,960px)] lg:max-w-[min(100%,1200px)]">
        <div
          className="relative isolate [transform:translateZ(0)]"
          style={{
            filter:
              "drop-shadow(0 28px 48px rgba(15, 23, 42, 0.14)) drop-shadow(0 12px 24px rgba(15, 23, 42, 0.08))",
          }}
        >
          <UrbanGlobe
            cities={cities}
            selectedCity={selectedCity}
            highlightedCity={highlightedCity}
            onSelectCity={onSelectCity}
          />
        </div>

        <div className="glass-chip pointer-events-none absolute bottom-6 left-2 z-10 flex max-w-[min(100%,280px)] flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[10px] text-black/70 sm:left-4 md:left-0">
          <span className="flex items-center gap-2">
            <span className="h-2 w-7 rounded-full bg-gradient-to-r from-black via-black/40 to-black/10 ring-1 ring-black/10" />
            <span className="font-medium text-accent">Sentiment</span>
          </span>
          <span className="hidden text-black/30 sm:inline">|</span>
          <span className="hidden text-black/55 sm:inline">
            Darker → lighter (avg)
          </span>
        </div>
        <p className="glass-chip pointer-events-none absolute right-2 top-2 z-10 max-w-[200px] rounded-lg px-2 py-1 text-left text-[10px] font-medium leading-snug text-black/55 sm:right-4 sm:top-4 sm:max-w-none md:right-0 md:top-0">
          Drag to orbit · <span className="text-black">Ctrl + scroll</span> or
          pinch to zoom · <span className="text-black">← →</span> when over
          globe
        </p>
      </div>
    </section>
  );
}
