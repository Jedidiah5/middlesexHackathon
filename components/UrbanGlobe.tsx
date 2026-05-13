"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { City } from "@/lib/types";
import { averageSentiment, sentimentToMono } from "@/lib/sentiment";

export type UrbanGlobeProps = {
  cities: City[];
  selectedCity: City | null;
  highlightedCity: string | null;
  onSelectCity: (city: City) => void;
};

type GlobePoint = City & {
  lng: number;
  color: string;
  altitude: number;
  radius: number;
  label: string;
};

export default function UrbanGlobe({
  cities,
  selectedCity,
  highlightedCity,
  onSelectCity,
}: UrbanGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 960, h: 520 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = Math.max(340, Math.min(580, w * 0.58));
      setDims({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pointsData: GlobePoint[] = useMemo(
    () =>
      cities.map((c) => {
        const avg = averageSentiment(c);
        const sel = selectedCity?.city === c.city;
        const hi = highlightedCity === c.city;
        return {
          ...c,
          lng: c.lon,
          color: sentimentToMono(avg),
          altitude: 0.014,
          radius: sel ? 0.64 : hi ? 0.52 : 0.4,
          label: `<div style="padding:8px 12px;background:#0a0a0a;color:#fafafa;border-radius:10px;font-size:12px;font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.25)"><strong>${c.city}</strong><br/><span style="opacity:0.75">avg ${avg.toFixed(2)}</span></div>`,
        };
      }),
    [cities, selectedCity, highlightedCity],
  );

  const handlePointClick = useCallback(
    (point: object) => {
      const p = point as GlobePoint;
      onSelectCity({
        city: p.city,
        country: p.country,
        lat: p.lat,
        lon: p.lon,
        gemini_sentiment: p.gemini_sentiment,
        perplexity_sentiment: p.perplexity_sentiment,
        top_themes: p.top_themes,
        gemini_summary: p.gemini_summary,
        perplexity_summary: p.perplexity_summary,
      });
    },
    [onSelectCity],
  );

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !selectedCity) return;
    g.pointOfView(
      { lat: selectedCity.lat, lng: selectedCity.lon, altitude: 1.9 },
      1100,
    );
  }, [selectedCity]);

  return (
    <div ref={wrapRef} className="h-full min-h-[320px] w-full">
      <div className="overflow-hidden rounded-2xl grayscale [contrast:1.07]">
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="rgba(0,0,0,0.12)"
          atmosphereAltitude={0.16}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude="altitude"
          pointRadius="radius"
          pointResolution={20}
          pointLabel="label"
          onPointClick={handlePointClick}
          onGlobeReady={() => {
            const g = globeRef.current;
            if (!g) return;
            const c = g.controls();
            c.autoRotate = true;
            c.autoRotateSpeed = 0.45;
            c.enableDamping = true;
            c.dampingFactor = 0.08;
          }}
        />
      </div>
    </div>
  );
}
