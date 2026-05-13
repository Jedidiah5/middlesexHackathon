"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { City } from "@/lib/types";
import { averageSentiment } from "@/lib/sentiment";

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

type CityRing = {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
};

const ROTATE_DEG = 6;
const AUTO_ROTATE_RESUME_MS = 4500;

/** Red pulse along ring radius `t` in [0, 1] (three-globe convention). */
function ringRedFlow(t: number): string {
  const alpha = Math.pow(1 - Math.min(1, Math.max(0, t)), 0.38);
  return `rgba(220, 38, 38, ${alpha})`;
}

export default function UrbanGlobe({
  cities,
  selectedCity,
  highlightedCity,
  onSelectCity,
}: UrbanGlobeProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointerOverRef = useRef(false);
  const autoRotateResumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const ringsData: CityRing[] = useMemo(
    () =>
      cities.map((c) => ({
        lat: c.lat,
        lng: c.lon,
        maxR: 9,
        propagationSpeed: 3.8,
        repeatPeriod: 2400,
      })),
    [cities],
  );

  const pointsData: GlobePoint[] = useMemo(
    () =>
      cities.map((c) => {
        const avg = averageSentiment(c);
        const sel = selectedCity?.city === c.city;
        const hi = highlightedCity === c.city;
        return {
          ...c,
          lng: c.lon,
          color: sel || hi ? "#ffffff" : "#fef2f2",
          altitude: 0.018,
          radius: sel ? 0.58 : hi ? 0.48 : 0.36,
          label: `<div style="padding:8px 12px;background:#fff;color:#0a0a0a;border:1px solid rgba(0,0,0,0.12);border-radius:10px;font-size:12px;font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><strong style="color:#15803d">${c.city}</strong><br/><span style="color:rgba(0,0,0,0.55)">avg ${avg.toFixed(2)}</span></div>`,
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

  /** Wheel over canvas: page scroll only. Pinch-zoom on trackpad = Ctrl/Meta + wheel; touch pinch uses separate handlers. */
  useEffect(() => {
    let detach: (() => void) | undefined;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 120;

    const tryId = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(tryId);
        return;
      }
      attempts += 1;
      const g = globeRef.current;
      const el = g?.renderer()?.domElement as HTMLCanvasElement | undefined;
      if (!el) {
        if (attempts >= maxAttempts) {
          window.clearInterval(tryId);
        }
        return;
      }

      window.clearInterval(tryId);

      const onWheel = (e: WheelEvent) => {
        const isPinchZoom = e.ctrlKey || e.metaKey;
        if (isPinchZoom) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        window.scrollBy({ top: e.deltaY, left: 0, behavior: "auto" });
      };

      el.addEventListener("wheel", onWheel, { passive: false, capture: true });
      detach = () =>
        el.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
    }, 50);

    return () => {
      cancelled = true;
      window.clearInterval(tryId);
      detach?.();
    };
  }, [dims.w, dims.h]);

  /** ← / → rotate camera when pointer was last seen over the globe. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!pointerOverRef.current) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const g = globeRef.current;
      if (!g) return;
      e.preventDefault();

      const controls = g.controls();
      controls.autoRotate = false;
      if (autoRotateResumeRef.current) {
        clearTimeout(autoRotateResumeRef.current);
      }
      autoRotateResumeRef.current = setTimeout(() => {
        controls.autoRotate = true;
        autoRotateResumeRef.current = null;
      }, AUTO_ROTATE_RESUME_MS);

      const pov = g.pointOfView();
      const delta = e.key === "ArrowLeft" ? -ROTATE_DEG : ROTATE_DEG;
      g.pointOfView(
        { lng: pov.lng + delta, lat: pov.lat, altitude: pov.altitude },
        280,
      );
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (autoRotateResumeRef.current) {
        clearTimeout(autoRotateResumeRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="h-full min-h-[320px] w-full outline-none"
      onPointerEnter={() => {
        pointerOverRef.current = true;
      }}
      onPointerLeave={() => {
        pointerOverRef.current = false;
      }}
      tabIndex={-1}
    >
      <div className="overflow-hidden rounded-2xl">
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
          bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
          showAtmosphere
          atmosphereColor="rgba(59, 130, 246, 0.22)"
          atmosphereAltitude={0.2}
          ringsData={ringsData}
          ringLat="lat"
          ringLng="lng"
          ringAltitude={0.002}
          ringColor={() => ringRedFlow}
          ringMaxRadius="maxR"
          ringPropagationSpeed="propagationSpeed"
          ringRepeatPeriod="repeatPeriod"
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
            c.enableZoom = true;
          }}
        />
      </div>
    </div>
  );
}
