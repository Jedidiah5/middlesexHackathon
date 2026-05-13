import type { City } from "@/lib/types";

/**
 * Cities that share at least one `top_themes` tag with the selection, ranked by overlap count.
 */
export function getSimilarCities(
  selected: City,
  all: City[],
  options?: { minOverlap?: number; limit?: number },
): City[] {
  const minOverlap = options?.minOverlap ?? 1;
  const limit = options?.limit ?? 6;
  const tags = new Set(selected.top_themes);
  if (tags.size === 0) return [];

  return all
    .filter((c) => c.city !== selected.city)
    .map((c) => ({
      city: c,
      overlap: c.top_themes.filter((t) => tags.has(t)).length,
    }))
    .filter(({ overlap }) => overlap >= minOverlap)
    .sort((a, b) => b.overlap - a.overlap || a.city.city.localeCompare(b.city.city))
    .slice(0, limit)
    .map(({ city }) => city);
}
