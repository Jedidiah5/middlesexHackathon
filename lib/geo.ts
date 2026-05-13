import type { City } from "@/lib/types";

/** Great-circle distance in kilometres (WGS84 sphere). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, a)));
}

/** Nearest dataset city to a globe click, only if within `maxKm` (avoids picking a city on empty-ocean clicks). */
export function nearestCityWithin(
  lat: number,
  lng: number,
  cities: City[],
  maxKm: number,
): City | null {
  let best: City | null = null;
  let bestKm = Infinity;
  for (const c of cities) {
    const km = haversineKm(lat, lng, c.lat, c.lon);
    if (km < bestKm) {
      bestKm = km;
      best = c;
    }
  }
  return best !== null && bestKm <= maxKm ? best : null;
}
