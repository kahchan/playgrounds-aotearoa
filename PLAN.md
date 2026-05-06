# Playgrounds Aotearoa — port plan

Port of [tour-de-playground](../tour-de-playground) into a multi-city playground explorer for Aotearoa.

## Intent

Exploration over completion. Pick a city, browse its playgrounds on a map, optionally generate a road-driving tour. No check-offs, no shared state, no names. Single GitHub Pages deploy, all cities in one bundle, hash routing.

## Cities (v1)

| City | Source | Notes |
|---|---|---|
| Wellington | WCC ArcGIS MapServer (already wired in TDP) | Port `scripts/refresh-playgrounds.mjs` as-is |
| Kāpiti | https://data-kcdc.opendata.arcgis.com/ | Likely inside parks/reserves layer |
| Hawke's Bay | Hastings DC + Napier City (two scripts, merge into one dataset) | HBRC is regional, not relevant |
| Christchurch | https://opendata-christchurchcity.hub.arcgis.com/ + https://gis.ccc.govt.nz/arcgis/rest/services | Strong open data culture |
| Auckland | https://data-aucklandcouncil.opendata.arcgis.com/ | May publish play *equipment* not playgrounds — dedupe step likely needed |

**Risk:** Auckland and possibly Hawke's Bay may give us point-per-piece-of-equipment rather than point-per-site. Per-city refresh script needs a clustering/dedupe step if so.

## Stack

Inherit from TDP: Vite + React + TypeScript, MapLibre GL + MapTiler tiles, OpenRouteService for routing, deploy to GitHub Pages via `gh-pages`. Red Hat Display font. Dark-mode default.

## Strip from TDP

- `worker/` directory entirely
- `useCheckIns` hook and all polling/cache logic
- `useName` hook
- Check-off / "done" visual state (teal ✓ markers, faded styling)
- Sidebar 3-way filter (All / Undone / Route) — sidebar is browse-only
- `disabledIds`, admin mode, `/?admin=1`, `/?reset=1`
- `VITE_WORKER_URL` env var

## Keep from TDP

- MapLibre + MapTiler vector tiles + dark/light theme tokens
- Suburb-grouped collapsible sidebar (read-only)
- Route cycle: north / south / location / off
- ORS chunked fetching with overlapping endpoints (chunks of 50, step 49)
- Per-leg `FeatureCollection` rendering with selected-leg highlighting
- TSP greedy nearest-neighbour from `lib/tsp.ts`
- Wordmark pill aesthetic (rename "Tour de / Playground" → "Playgrounds / Aotearoa", keep palette)
- Theme toggle, dark default, `prefers-color-scheme` fallback

## Add

### City as first-class concept

```
src/cities/
  index.ts          // registry: { slug, label, bbox, center, zoom, dataPath }
  wellington.json
  kapiti.json
  hawkes-bay.json
  christchurch.json
  auckland.json
```

Playground shape stays the same as TDP minus `included` (filter at refresh-script time instead):

```ts
{ id: string; name: string; lat: number; lng: number; suburb: string | null; source: string }
```

### Hash routing

`#/` → landing screen. `#/wellington`, `#/kapiti`, etc. → map for that city. New `useCity.ts` hook subscribes to `hashchange` via `useSyncExternalStore`. No router library.

Benefits: shareable URLs, browser back works between cities, refresh preserves city, no localStorage needed for "current city."

### Landing screen

`src/components/Landing.tsx`. Short about-me blurb (style after [what-would-merckx-do](../what-would-merckx-do)), then a row of city pill cards. Each card shows city name + playground count. Click → set hash → map view.

### City switcher

Wordmark becomes a button. Click → inline popover with city list + "← Back to landing." Same `<CitySwitcher/>` component reused on landing screen and inside the map view.

### Routing changes

- ORS profile: `cycling-mountain` → `driving-car`
- Route button moves out of the wordmark cluster into the sidebar header (secondary action, not primary)
- Otherwise `useRoute.ts` is untouched

## File-by-file plan

```
src/
  cities/
    index.ts                 NEW
    {city}.json              NEW × 5
  components/
    Landing.tsx              NEW
    CitySwitcher.tsx         NEW
    Wordmark.tsx             EDIT — clickable, opens switcher, route button removed
    MapView.tsx              EDIT — accepts city, recenters on city change, drop ✓/done styling
    Sidebar.tsx              EDIT — drop filter + admin, add route button to header
  hooks/
    useCity.ts               NEW — hash → slug
    useRoute.ts              EDIT — profile = driving-car
    useDarkMode.ts           KEEP
    useCheckIns.ts           DELETE
    useName.ts               DELETE
  lib/
    tsp.ts                   KEEP
  App.tsx                    EDIT — branch on hash: landing or map
  index.css                  KEEP (palette + tokens)
  types.ts                   EDIT — drop check-in types
scripts/
  refresh-wellington.mjs     PORT from refresh-playgrounds.mjs
  refresh-kapiti.mjs         NEW
  refresh-hawkes-bay.mjs     NEW (merges Hastings + Napier)
  refresh-christchurch.mjs   NEW
  refresh-auckland.mjs       NEW
worker/                      DELETE
```

`package.json` scripts: one `refresh-{city}` per city, plus `refresh-all` that runs them sequentially.

## Open items / later

- **Branding revisit** — keep TDP palette (teal `#00c8d7` / purple `#9b20d0`) and pill wordmark for v1. Revisit once multi-city UX settles. Add `BRANDING.md` placeholder.
- **Equipment-vs-site dedupe** — verify per-city when wiring refresh scripts. If Auckland/HB return per-equipment points, add clustering pass (e.g. group within ~30m radius, take centroid + most common name).
- **Offline / preview thumbnails on landing cards** — defer until v1 ships.

## Build order

1. Scaffold repo (copy TDP, strip Worker + check-in code, rename, build still passes)
2. Add `cities/` registry + Wellington data ported over, single hardcoded city working end-to-end
3. Hash routing + landing screen + city switcher (Wellington only)
4. Wire up second city (Kāpiti likely easiest after Wellington since both ArcGIS) — this is where the city abstraction gets stress-tested
5. Routing: swap ORS profile, move route button to sidebar
6. Remaining cities: Christchurch, Auckland, Hawke's Bay
7. Deploy
