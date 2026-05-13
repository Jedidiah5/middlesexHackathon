# Tripee — Project overview (presentation notes)

This document summarizes what **Tripee** is, how it is built, and what we implemented end-to-end. Use it as speaker notes or a handout for demos.

---

## 1. What is Tripee?

**Tripee** is an interactive web app that compares how two large language models — **Google Gemini** and **Perplexity** — “see” global cities in text: sentiment scores, dominant **theme clusters** (with percentages), **keywords**, and high-level **website tags**.

Users explore:

- A **3D globe** of cities (click markers or click near a marker to snap to the nearest city).
- A **side panel** with rich per-city analytics, **similar cities** (shared tags), and an **“Ask Claude”** bias-analyst chat (Anthropic API, with a **dummy mode** when no API key is set).
- A **sentiment comparison chart** and **theme filters** over the full static dataset.

All city content ships as **static JSON** (`/public/cities_data.json`); there is **no custom backend** for the dataset itself. Optional **server routes** exist only for the Claude chat integration.

---

## 2. Tech stack

| Layer | Choice |
|--------|--------|
| Framework | **Next.js 14** (App Router), **React 18**, **TypeScript** |
| Styling | **Tailwind CSS**, custom **glass** utilities (`globals.css`) |
| Globe | **react-globe.gl** (+ **three** / **globe.gl** transpiled in `next.config.mjs`) |
| Charts | **Recharts** (Gemini vs Perplexity bar comparison) |
| Optional AI | **@anthropic-ai/sdk** (Claude in `/app/api/chat`) |
| Fonts | **DM Sans** (UI), **JetBrains Mono**, **Nunito** (Tripee wordmark via CSS variable) |
| Deploy | **Vercel** (typical); env vars for Anthropic when using live Claude |

---

## 3. Data model & pipeline

### Source of truth

- **`public/cities_data.json`** — array of **City** objects consumed at runtime (`fetch` in `app/page.tsx`).

### Team handoff files

Under **`ActualData/`**:

- **`city_perception_website_data.json`** — `interesting_insight`, `website_tags`, `keywords` (Gemini / Perplexity / shared), `model_difference`, etc.
- **`city_model_top3_themes (1).json`** — top **3 theme clusters per model** with **percentages** (`models.Gemini`, `models.perplexity` — note lowercase **`perplexity`**).

### Merge script

- **`scripts/merge-actual-data.mjs`** (run via **`npm run merge:cities`**) joins handoff JSON with the existing **geo + numeric sentiment** baseline so every city keeps **lat / lon / country** and sentiment scores while replacing narrative fields with real team outputs.
- **Mojibake fix** for two names in handoff (`Bogotá`, `São Paulo`) so rows align with canonical `cities_data.json` keys.
- Output includes **`model_clusters`**, **`keywords`**, **`interesting_insight`**, and **`top_themes`** from **`website_tags`**.

### Optional enrichment

- **`scripts/enrich-cities.mjs`** — can refresh synthetic blurbs for cities *without* legacy hand-picked copy (optional; main path today is the merge script + ActualData).

### TypeScript type (`lib/types.ts`)

Each **City** includes: `city`, `country`, `lat`, `lon`, `gemini_sentiment`, `perplexity_sentiment`, `top_themes`, summaries, plus optional **`model_clusters`**, **`keywords`**, **`interesting_insight`**.

---

## 4. Main user flows

### Globe (`components/WorldMap.tsx` + `UrbanGlobe.tsx`)

- **59 cities** as elevated points + subtle **pulse rings**.
- **Interaction fixes**
  - **`pointsHoverPrecision`** raised so raycasts hit point sprites (not only `lineHoverPrecision`).
  - **`onGlobeClick`**: if the ray hits the globe instead of a point, select the **nearest city** within a **km threshold** (avoids random picks in the open ocean).
  - **`pointerEventsFilter`** ignores ring/atmosphere meshes so **clicks reach markers**.
  - **Wheel**: normal wheel scrolls the page; **Ctrl/Meta + wheel** (or pinch) zooms the globe; **arrow keys** rotate when focus is over the globe.
- Selecting a city passes the **full `City` object** (including clusters/keywords) into app state.

### City detail panel (`components/CityPanel.tsx`)

- **Desktop**: right-hand **glass** sidebar; **mobile**: **top sheet** so the panel is not buried below the fold (fixed earlier Tailwind **`relative` vs `fixed`** conflict).
- **Similar cities**: **`lib/similarCities.ts`** — cities sharing **≥1** `top_themes` tag, ranked by overlap; chips jump to another city.
- **Content order (rich data)**
  - Random **keyword** (or cluster) snippets for Gemini vs Perplexity (new random when the **city** changes).
  - **Interesting insight** directly under those snippets.
  - **Large %** for the top cluster per model, then full **top-3 cluster** lists with bold percentages.
  - **Keyword** sections (Gemini, Perplexity, shared) and **website tags**.
- **Ask Claude** (bottom, pinned in the panel column)
  - Logo: **`components/claudelogo.png`** beside **“Ask Claude”**.
  - Textarea, **Send** button, **“Thinking…”** while loading, reply with **`animate-fade-in`** (Tailwind keyframes in `tailwind.config.ts`).
- **Fallback layout** if `model_clusters` is missing (older JSON): classic two-column summaries + theme chips.

### Rest of the page (`app/page.tsx`)

- **StatBar** — dataset-wide aggregates.
- **ComparisonChart** — scrollable tall chart so **~60 cities** stay readable.
- **ThemeExplorer** — toggles **activeTheme**; globe + panel respect filtered `mapCities` where applicable; **similar cities** still use the **full** list for better matches.

---

## 5. Claude / “Ask Claude” feature

### API route — `app/api/chat/route.ts`

- **POST** `{ message, city }`.
- Builds a **system prompt** from the live **City** payload (sentiment, summaries, tags, clusters, keywords, insight).
- **Live mode**: **`ANTHROPIC_API_KEY`** set → **Anthropic** `messages.create` with **`claude-sonnet-4-20250514`**, short answers, bias-aware instructions.
- **Dummy mode**: no key, or **`CLAUDE_USE_DUMMY=1`** → returns **`buildDummyReply`** (no API cost). Response includes **`dummy: true`** when canned.
- Helper renamed **`isDummyClaudeMode`** (not `useDummy…`) so **ESLint** does not treat it as a React Hook inside the route handler — fixes **Vercel build** failures from `react-hooks/rules-of-hooks`.

### Environment (see `.env.example`)

- **`ANTHROPIC_API_KEY`** — live Claude.
- **`CLAUDE_USE_DUMMY`** — `1` forces dummy even if a key exists (useful for demos).

---

## 6. Branding & copy

- Product name: **Tripee** (header wordmark uses **Nunito** via `--font-tripee` + `.font-tripee` in `globals.css`).
- **`app/layout.tsx`** metadata title/description updated for SEO / link previews.
- **`app/page.tsx`** header paragraphs describe the real product: **Gemini vs Perplexity**, globe, panel, filters, static data.

---

## 7. Build & deploy lessons

| Issue | What we did |
|--------|----------------|
| **Vercel / `three` types** | Added **`@types/three`** devDependency. |
| **ESLint “Hook” in API route** | Renamed **`useDummyClaude`** → **`isDummyClaudeMode`**. |
| **Stale `.next` cache** | Occasionally **`rm -rf .next`** (or delete folder on Windows) before `npm run build`. |

---

## 8. File map (quick reference)

| Path | Role |
|------|------|
| `app/page.tsx` | Home layout: header, globe, main, `CityPanel` wiring |
| `app/layout.tsx` | Fonts, global metadata |
| `app/globals.css` | Glass components, `.font-tripee` |
| `app/api/chat/route.ts` | Claude POST handler + dummy mode |
| `components/UrbanGlobe.tsx` | Globe dimensions, rings, clicks, wheel, keys |
| `components/WorldMap.tsx` | Dynamic import of globe, chrome |
| `components/CityPanel.tsx` | Detail UI + Ask Claude + logo |
| `components/ComparisonChart.tsx` | Scrollable Recharts |
| `components/StatBar.tsx`, `ThemeExplorer.tsx` | Aggregates & filters |
| `lib/types.ts` | `City` + related types |
| `lib/geo.ts` | Haversine + nearest city helper |
| `lib/similarCities.ts` | Similar cities by shared tags |
| `lib/sentiment.ts` | Average sentiment helper |
| `public/cities_data.json` | Bundled dataset (output of merge) |
| `ActualData/*.json` | Team handoff inputs |
| `scripts/merge-actual-data.mjs` | Rebuild `cities_data.json` |
| `next.config.mjs` | `transpilePackages` for globe packages |

---

## 9. Demo checklist (live presentation)

1. **Load** home → globe spins; **StatBar** shows city count.
2. **Click** a city (or near one) → **panel** opens with clusters, keywords, insight.
3. **Similar cities** → switch city without closing panel.
4. **Theme filter** → fewer markers; panel clears if selection not in filtered set (existing guard).
5. **Chart** → highlight bars, syncs with globe highlight where wired.
6. **Ask Claude** → type a question → **dummy** reply without API key, or real reply with **`ANTHROPIC_API_KEY`** on Vercel.
7. **Mobile** (or narrow viewport) → panel as **top sheet** + backdrop.

---

## 10. Optional next steps (talk track)

- Wire **real sentiment** from the team when available (extend merge script + types).
- **Rate-limit** `/api/chat` and add **auth** if the app goes public.
- Install **`sharp`** for production image optimization (Next.js warning when using `next/image`).
- Rename **`package.json` `name`** from `urban-lens` to `tripee` if you want npm consistency.

---

*Generated for presentation use — adjust tone or depth per your audience (technical vs stakeholder).*
