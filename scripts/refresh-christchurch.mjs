#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'christchurch.json')

// CCC Furniture FeatureServer, layer 16 — PlayModularUnit (per-equipment, deduped to per-site)
const CCC_ENDPOINT =
  'https://gis.ccc.govt.nz/server/rest/services/OpenData/Furniture/FeatureServer/16/query' +
  "?where=ServiceStatus%3D'In+Service'&outFields=SiteName&outSR=4326&f=geojson"

// Christchurch city bbox for OSM locality lookup
const BBOX = '-43.65,172.40,-43.40,172.85'
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const OVERPASS_HEADERS = { 'User-Agent': 'playgrounds-aotearoa/1.0 (https://github.com/kahchan/playgrounds-aotearoa)' }

async function fetchEquipment() {
  const res = await fetch(CCC_ENDPOINT)
  if (!res.ok) throw new Error(`CCC fetch failed: ${res.status}`)
  return res.json()
}

async function fetchLocalities() {
  const query = `
    [out:json][timeout:30];
    (
      node["place"~"suburb|locality|village|town|neighbourhood"](${BBOX});
    );
    out body;
  `
  const url = new URL(OVERPASS_URL)
  url.searchParams.set('data', query.trim())
  const res = await fetch(url.toString(), { headers: OVERPASS_HEADERS })
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`)
  return res.json()
}

function nearestLocality(lat, lng, localities) {
  let best = null
  let bestDist = Infinity
  for (const loc of localities) {
    const dlat = lat - loc.lat
    const dlng = (lng - loc.lng) * Math.cos((lat * Math.PI) / 180)
    const dist = dlat * dlat + dlng * dlng
    if (dist < bestDist) {
      bestDist = dist
      best = loc
    }
  }
  return best
}

// "PRK_3537 - Cass Bay Playground" → "Cass Bay Playground"
function parseName(siteName) {
  const match = siteName?.match(/^[A-Z]+_\d+\s+-\s+(.+)$/)
  return match ? match[1].trim() : (siteName ?? 'Playground')
}

async function main() {
  console.log('Fetching Christchurch playground data from CCC…')
  const [geojson, locData] = await Promise.all([fetchEquipment(), fetchLocalities()])

  const localities = locData.elements
    .filter((e) => e.tags?.name)
    .map((e) => ({ name: e.tags.name, lat: e.lat, lng: e.lon }))
  console.log(`  ${localities.length} locality nodes found`)
  console.log(`  ${geojson.features?.length} equipment records received`)

  // Group by SiteName, compute centroid lat/lng
  const siteMap = new Map()
  for (const f of geojson.features ?? []) {
    const siteName = f.properties?.SiteName
    if (!siteName) continue
    const [lng, lat] = f.geometry.coordinates
    if (!siteMap.has(siteName)) siteMap.set(siteName, { lats: [], lngs: [] })
    siteMap.get(siteName).lats.push(lat)
    siteMap.get(siteName).lngs.push(lng)
  }

  const playgrounds = Array.from(siteMap.entries()).map(([siteName, { lats, lngs }]) => {
    const lat = lats.reduce((a, b) => a + b, 0) / lats.length
    const lng = lngs.reduce((a, b) => a + b, 0) / lngs.length
    return {
      id: `ccc-${siteName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`,
      name: parseName(siteName),
      lat,
      lng,
      suburb: nearestLocality(lat, lng, localities)?.name ?? null,
      source: 'ccc',
    }
  })

  const suburbs = [...new Set(playgrounds.map((p) => p.suburb))].sort()
  console.log(`  ${playgrounds.length} unique sites`)
  console.log(`  Suburbs: ${suburbs.join(', ')}`)

  writeFileSync(OUTPUT_PATH, JSON.stringify(playgrounds, null, 2) + '\n')
  console.log(`\nWritten to ${OUTPUT_PATH}`)
  console.log('Review, then: git add public/christchurch.json && git commit')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
