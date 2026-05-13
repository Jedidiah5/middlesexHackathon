/**
 * One-off / re-runnable: refresh synthetic blurbs & themes for cities_data.json
 * Preserves full records for legacy demo cities.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, "..", "public", "cities_data.json");

const LEGACY = new Set([
  "London",
  "Lagos",
  "Tokyo",
  "Mumbai",
  "Paris",
  "New York City",
]);

/** Five tags per country (fallback: city name split) */
const COUNTRY_THEMES = {
  Ghana: ["coastal", "markets", "highlife", "harmattan haze", "Atlantic breeze"],
  Ethiopia: ["highland", "coffee", "orthodox", "construction", "cool nights"],
  Jordan: ["hills", "refugee corridors", "Levantine food", "ancient stones", "traffic"],
  Greece: ["marble", "ferries", "tavernas", "sun-bleached", "protest stickers"],
  "New Zealand": ["harbours", "volcanic soil", "rugby", "sprawl", "salt wind"],
  Iraq: ["Tigris dust", "minarets", "checkpoints", "tea stalls", "heat shimmer"],
  Thailand: ["tuk-tuks", "temples", "humid", "night markets", "Chao Phraya"],
  China: ["hutong vs towers", "smog", "bicycles", "magnolia", "scale"],
  Lebanon: ["Mediterranean", "pockmarked facades", "generator hum", "nightlife", "cedar"],
  India: ["monsoon", "spice", "horns", "temple bells", "contrast"],
  Germany: ["U-Bahn", "parks", "concrete", "beer gardens", "history"],
  Colombia: ["Andean air", "transmilenio", "green mountains", "salsa", "coffee"],
  Australia: ["subtropical", "river city", "Queenslander houses", "cyclists", "humid"],
  Hungary: ["thermal baths", "Danube", "Habsburg bones", "ruin bars", "trams"],
  Argentina: ["tango bass", "jacaranda", "beef smoke", "wide avenues", "inflation"],
  Egypt: ["Nile haze", "minarets", "honking", "dust", "ancient weight"],
  USA: ["freeways", "strip malls", "diversity", "neon", "sprawl"],
  Senegal: ["Atlantic light", "teranga", "sand", "music", "fish smoke"],
  "United Arab Emirates": [
    "glass towers",
    "AC cold",
    "construction cranes",
    "migrant corridors",
    "desert edge",
  ],
  Cuba: ["sea rust", "classic cars", "salsa", "colonial arcades", "blackouts"],
  Indonesia: ["monsoon drains", "kampungs", "mosques", "traffic", "fried rice haze"],
  "South Africa": ["mine dumps", "thunderheads", "townships", "jacaranda", "highveld"],
  Rwanda: ["thousand hills", "boda bodas", "tea", "mist", "orderly streets"],
  Jamaica: ["harbour", "reggae bass", "hills", "humid", "colour"],
  Malaysia: ["petronas glare", "hawker steam", "monsoon", "mosques", "humid"],
  Bolivia: ["altitude", "cable cars", "Aymara", "dust", "mountain cold"],
  Nigeria: ["chaotic", "vibrant", "noise", "heat", "traffic"],
  Peru: ["Pacific fog", "ceviche", "andes shadow", "combis", "dust"],
  UK: ["rain", "multicultural", "busy", "grey", "historic"],
  Spain: ["plazas", "tapas", "siesta heat", "tiles", "football"],
  Bahrain: ["causeway", "pearling past", "finance", "heat", "mosques"],
  Philippines: ["jeepneys", "typhoon", "smog", "malls", "islands-in-one-city"],
  Mexico: ["altiplano", "tacos", "metro crush", "muralismo", "haze"],
  Uruguay: ["Río de la Plata", "mate", "quiet blocks", "meat smoke", "placid"],
  Canada: ["snow slush", "diversity", "poutine", "construction", "lake wind"],
  Oman: ["wadi dry", "frankincense", "white buildings", "heat", "sea"],
  Kenya: ["safari edge", "matatus", "red dust", "jacaranda", "NGOs"],
  Portugal: ["azulejos", "Douro wind", "tiles", "tram clang", "Atlantic"],
  Ecuador: ["volcano silhouette", "altitude", "markets", "bus fumes", "green"],
  Brazil: ["samba bass", "humid", "concrete", "beach vs favela", "colour"],
  Italy: ["vespas", "stone", "espresso", "ruins", "tourist tide"],
  "Puerto Rico": ["hurricane scars", "Old San Juan blue", "salsa", "humid", "ocean"],
  Chile: ["Andes snowline", "earthquake memory", "wine", "smog bowl", "order"],
  "South Korea": ["neon", "subway", "kimchi", "hills", "polite rush"],
  Estonia: ["Baltic grey", "digital", "medieval walls", "forest edge", "quiet"],
  Iran: ["traffic knots", "poetry", "pollution", "mountains", "bazaar"],
  Japan: ["orderly", "clean", "neon", "efficient", "quiet"],
  Mongolia: ["bitter winter", "ger districts", "coal smoke", "vast sky", "horses"],
  Laos: ["Mekong slow", "temples", "French crumbs", "dust", "quiet"],
  Poland: ["cobblestones", "vodka steam", "rebuilt centre", "trams", "grey spring"],
  France: ["elegant", "romantic", "cafe", "history", "art"],
  Turkey: ["Bosphorus ferries", "minarets", "tea", "traffic", "layers"],
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick(arr, i) {
  return arr[i % arr.length];
}

const GEMINI = [
  (c, co) =>
    `${c} wears the afternoon like a thin coat — ${co} shows up in diesel, jasmine, and the sound of someone selling fruit from a doorway.`,
  (c, co) =>
    `Heat and ambition share the same sidewalk here. ${c} does not apologize for being loud; it simply assumes you came to keep up.`,
  (c, co) =>
    `The skyline argues with the horizon. In ${c}, ${co} feels stitched together from a dozen older cities that refuse to be forgotten.`,
  (c, co) =>
    `Evening brings a softer light, but not quiet. ${c} keeps its radios on, its kitchens open, and its streets politely impatient.`,
  (c, co) =>
    `You learn ${c} by smell first — exhaust, sea salt, charcoal, rain on dust — then by how ${co} rearranges itself every few blocks.`,
  (c, co) =>
    `There is a rhythm under the chaos: doors closing, horns answering, a kettle whistling somewhere high above the street in ${c}.`,
  (c, co) =>
    `${c} saves its prettiest lies for postcards. Up close, ${co} is scraped knees, cracked tiles, and stubborn flowers in a railing pot.`,
  (c, co) =>
    `The wind carries news from elsewhere. ${c} listens, then answers in its own dialect of traffic, music, and public announcements.`,
  (c, co) =>
    `Shadows run long across plazas and parking lots. ${c} feels older than its newest tower and younger than its oldest grudge.`,
  (c, co) =>
    `Someone is always building, someone is always repairing. ${c} is ${co} in motion — ladders, tarps, and optimism tied down with twine.`,
  (c, co) =>
    `Rain or dust, the air carries weight. ${c} teaches you quickly where the awnings are, and which doorways smell like home cooking.`,
  (c, co) =>
    `Neon and daylight negotiate a truce at dusk. ${c} blinks on, block by block, as if the city itself is waking for a second shift.`,
];

const PERPLEXITY = [
  (c, co) =>
    `Public space is a negotiation: a vendor claims a corner, a bus claims a lane, and ${c} pretends not to notice ${co} watching.`,
  (c, co) =>
    `You can map ${c}, but you cannot map the detours — the closed street, the festival, the sudden downpour that turns every curb into a decision.`,
  (c, co) =>
    `People move with practiced impatience, eyes on phones and potholes. ${c} rewards locals who know which shortcuts are safe after dark.`,
  (c, co) =>
    `The city stacks economies vertically: shops below, offices above, someone's laundry flapping like a quiet flag between them in ${c}.`,
  (c, co) =>
    `Music leaks from windows and tailgates. ${c} is ${co} with the volume turned up — not cruelly, just honestly.`,
  (c, co) =>
    `Transit is theatre: doors hiss, bodies compress, strangers share the same humid breath and pretend it is normal in ${c}.`,
  (c, co) =>
    `Markets sell certainty — ripe fruit, plastic sandals, phone cards — while the streets outside sell only the next ten minutes.`,
  (c, co) =>
    `There is beauty in the friction: languages colliding, signage half translated, ${c} refusing to be one story about ${co}.`,
  (c, co) =>
    `At night, the heat loosens its grip but not its memory. ${c} glows in strips: kitchens, phone shops, late buses, quiet balconies.`,
  (c, co) =>
    `Tour guides promise icons; residents promise corners. ${c} is mostly corners — where ${co} actually happens.`,
  (c, co) =>
    `Construction tape is a kind of wallpaper here. ${c} keeps rewriting itself while everyone tries to remember where the old bakery was.`,
  (c, co) =>
    `The sea, the river, or the memory of water sets the mood. ${c} carries humidity in its voice, even when the sky looks clear.`,
];

const rows = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

for (const row of rows) {
  if (LEGACY.has(row.city)) continue;

  const h = hash(row.city);
  const themes = COUNTRY_THEMES[row.country];
  if (themes) {
    row.top_themes = [0, 1, 2, 3, 4].map((i) => pick(themes, h + i));
  } else {
    const fb = ["streets", "cafes", "transit", "markets", "night air"];
    row.top_themes = [0, 1, 2, 3, 4].map((i) => pick(fb, h + i * 7));
  }

  row.gemini_summary = pick(GEMINI, h)(row.city, row.country);
  row.perplexity_summary = pick(PERPLEXITY, h + 3)(row.city, row.country);

  const g = ((h % 90) - 45) / 100;
  const p = (((h >> 3) % 90) - 45) / 100;
  row.gemini_sentiment = Math.round(g * 100) / 100;
  row.perplexity_sentiment = Math.round(p * 100) / 100;
}

fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2) + "\n");
console.log("Updated", rows.length, "cities; preserved", [...LEGACY].join(", "));
