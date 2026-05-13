/**
 * Merges team handoff JSON with existing geo + numeric sentiment in public/cities_data.json.
 * Run from repo root: node scripts/merge-actual-data.mjs
 *
 * Inputs:
 *   ActualData/city_perception_website_data.json
 *   ActualData/city_model_top3_themes (1).json
 *   public/cities_data.json (canonical city names, lat/lon/country, sentiment scores)
 *
 * Output: public/cities_data.json (overwritten)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const PATH_PERCEPTION = path.join(
  root,
  "ActualData",
  "city_perception_website_data.json",
);
const PATH_TOP3 = path.join(
  root,
  "ActualData",
  "city_model_top3_themes (1).json",
);
const PATH_BASE = path.join(root, "public", "cities_data.json");
const PATH_OUT = path.join(root, "public", "cities_data.json");

/** Fix mojibake / alternate spellings so handoff rows match public/cities_data.json keys. */
function canonicalCityName(name) {
  const fixes = {
    "Bogota╠ü": "Bogotá",
    "Bogota\u0301": "Bogotá",
    "Sa╠âo Paulo": "São Paulo",
  };
  return fixes[name] ?? name;
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function formatClusterLine(label, entries) {
  if (!entries?.length) return "";
  return entries
    .map(
      (e) =>
        `${e.theme} (${typeof e.percentage === "number" ? e.percentage.toFixed(1) : e.percentage}%)`,
    )
    .join("; ");
}

function clip(s, max = 1600) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

const perception = loadJson(PATH_PERCEPTION);
const top3 = loadJson(PATH_TOP3);
const base = loadJson(PATH_BASE);

const percBy = new Map(
  perception.map((row) => [canonicalCityName(row.city), row]),
);
const topBy = new Map(top3.map((row) => [canonicalCityName(row.city), row]));

const merged = [];
const missing = [];

for (const row of base) {
  const key = canonicalCityName(row.city);
  const perc = percBy.get(key);
  const top = topBy.get(key);

  if (!perc || !top) {
    missing.push(key);
    merged.push(row);
    continue;
  }

  const gLine = formatClusterLine(
    "Gemini",
    top.models?.Gemini ?? top.models?.gemini,
  );
  const pLine = formatClusterLine(
    "Perplexity",
    top.models?.Perplexity ?? top.models?.perplexity,
  );

  const gemini_summary = clip(
    `${perc.interesting_insight ?? ""}\n\nDominant Gemini clusters in the corpus: ${gLine}`,
  );
  const perplexity_summary = clip(
    `Dominant Perplexity clusters in the corpus: ${pLine}\n\n${perc.model_difference ?? ""}`,
  );

  merged.push({
    city: row.city,
    country: row.country,
    lat: row.lat,
    lon: row.lon,
    gemini_sentiment: row.gemini_sentiment,
    perplexity_sentiment: row.perplexity_sentiment,
    top_themes: Array.isArray(perc.website_tags)
      ? [...perc.website_tags]
      : row.top_themes,
    gemini_summary,
    perplexity_summary,
  });
}

fs.writeFileSync(PATH_OUT, JSON.stringify(merged, null, 2) + "\n", "utf8");

console.log("Wrote", merged.length, "cities to", PATH_OUT);
if (missing.length) {
  console.warn("No handoff row for (kept base copy):", missing.join(", "));
}
