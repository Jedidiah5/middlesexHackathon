"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { City } from "@/lib/types";
import { nearestCityWithin } from "@/lib/geo";
import { averageSentiment } from "@/lib/sentiment";

/** If the ray hits the globe instead of a point, snap to the nearest city within this distance. */
const GLOBE_CLICK_SNAP_KM = 920;

const LG_BREAKPOINT = "(min-width: 1024px)";

/** Rings + atmosphere sit in front of points in the raycast stack; ignore them so city markers receive clicks. */
function globePointerEventsFilter(obj: object, _data?: object): boolean {
  const t = (obj as { __globeObjType?: string }).__globeObjType;
  if (t === "ring" || t === "atmosphere") return false;
  return true;
}

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
  const [dims, setDims] = useState({ w: 480, h: 360 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const mql = window.matchMedia(LG_BREAKPOINT);
    const measure = () => {
      const w = el.clientWidth;
      const large = mql.matches;
      const h = large
        ? Math.max(680, Math.min(1160, w * 1.16))
        : Math.max(340, Math.min(580, w * 0.58));
      setDims({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    mql.addEventListener("change", measure);
    return () => {
      ro.disconnect();
      mql.removeEventListener("change", measure);
    };
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

  const selectCity = useCallback(
    (c: City) => {
      onSelectCity(c);
    },
    [onSelectCity],
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
          radius: sel ? 0.78 : hi ? 0.64 : 0.52,
          label: `<div style="padding:8px 12px;background:#fff;color:#0a0a0a;border:1px solid rgba(0,0,0,0.12);border-radius:10px;font-size:12px;font-family:system-ui,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.08)"><strong style="color:#15803d">${c.city}</strong><br/><span style="color:rgba(0,0,0,0.55)">avg ${avg.toFixed(2)}</span></div>`,
        };
      }),
    [cities, selectedCity, highlightedCity],
  );

  const handlePointClick = useCallback(
    (point: object) => {
      const g = globeRef.current;
      if (g) {
        g.controls().autoRotate = false;
      }
      const p = point as GlobePoint;
      selectCity(p);
    },
    [selectCity],
  );

  /** Globe surface hit (point missed raycast): open closest city if click was near enough on the ground. */
  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }) => {
      const g = globeRef.current;
      if (g) {
        g.controls().autoRotate = false;
      }
      const hit = nearestCityWithin(
        coords.lat,
        coords.lng,
        cities,
        GLOBE_CLICK_SNAP_KM,
      );
      if (hit) selectCity(hit);
    },
    [cities, selectCity],
  );

  /** Stop auto-rotate when a city is selected + fly camera; resume rotate after panel closes. */
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const c = g.controls();
    if (selectedCity) {
      c.autoRotate = false;
      g.pointOfView(
        { lat: selectedCity.lat, lng: selectedCity.lon, altitude: 1.9 },
        1100,
      );
      return;
    }
    const id = window.setTimeout(() => {
      c.autoRotate = true;
    }, 1600);
    return () => window.clearTimeout(id);
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
      className="h-full min-h-[min(52vh,360px)] w-full bg-transparent outline-none lg:min-h-[min(76vh,720px)]"
      onPointerEnter={() => {
        pointerOverRef.current = true;
      }}
      onPointerLeave={() => {
        pointerOverRef.current = false;
        const el = globeRef.current?.renderer()?.domElement as
          | HTMLCanvasElement
          | undefined;
        if (el) el.style.cursor = "";
      }}
      tabIndex={-1}
    >
      {/* No rounded box — globe reads as floating on the page */}
      <div className="overflow-visible bg-transparent">
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          enablePointerInteraction
          pointerEventsFilter={globePointerEventsFilter}
          lineHoverPrecision={8}
          {...{
            pointsHoverPrecision: 10,
            clickAfterDrag: true,
          }}
          onGlobeClick={handleGlobeClick}
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
          onPointHover={(pt) => {
            const el = globeRef.current?.renderer()?.domElement as
              | HTMLCanvasElement
              | undefined;
            if (!el) return;
            el.style.cursor = pt ? "pointer" : "grab";
          }}
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
