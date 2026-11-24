#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'kaikoura.json')

// Kaikōura town and district
const BBOX = '-42.44,173.63,-42.37,173.73'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const OVERPASS_HEADERS = { 'User-Agent': 'playgrounds-aotearoa/1.0 (https://github.com/kahchan/playgrounds-aotearoa)' }

async function overpassQuery(query) {
  const url = new URL(OVERPASS_URL)
  url.searchParams.set('data', query.trim())
  const res = await fetch(url.toString(), { headers: OVERPASS_HEADERS })
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`)
  return res.json()
}

async function fetchPlaygrounds() {
  const query = `
    [out:json][timeout:30];
    (
      node["leisure"="playground"](${BBOX});
      way["leisure"="playground"](${BBOX});
      relation["leisure"="playground"](${BBOX});
    );
    out center;
  `
  return overpassQuery(query)
}

async function fetchLocalities() {
  const query = `
    [out:json][timeout:30];
    (
      node["place"~"suburb|locality|village|town|neighbourhood"](${BBOX});
    );
    out body;
  `
  return overpassQuery(query)
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

async function main() {
  console.log('Fetching Kaikōura playgrounds from OpenStreetMap…')
  const [pgData, locData] = await Promise.all([fetchPlaygrounds(), fetchLocalities()])

  const localities = locData.elements
    .filter((e) => e.tags?.name)
    .map((e) => ({ name: e.tags.name, lat: e.lat, lng: e.lon }))
  console.log(`  ${localities.length} locality nodes found`)

  const playgrounds = pgData.elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat
      const lng = el.lon ?? el.center?.lon
      if (lat == null || lng == null) return null

      return {
        id: `osm-${el.type[0]}${el.id}`,
        name: el.tags?.name ?? 'Playground',
        lat,
        lng,
        suburb: nearestLocality(lat, lng, localities)?.name ?? null,
      }
    })
    .filter(Boolean)

  // Deduplicate nodes that overlap with way/relation centroids (~20 m)
  const ways = playgrounds.filter((p) => !p.id.startsWith('osm-n'))
  const deduped = playgrounds.filter((p) => {
    if (!p.id.startsWith('osm-n')) return true
    return !ways.some((w) => {
      const dlat = p.lat - w.lat
      const dlng = (p.lng - w.lng) * Math.cos((p.lat * Math.PI) / 180)
      return dlat * dlat + dlng * dlng < 3.3e-8
    })
  })

  if (deduped.length < playgrounds.length) {
    console.log(`  Deduplicated ${playgrounds.length - deduped.length} overlaps → ${deduped.length} total`)
  } else {
    console.log(`  ${deduped.length} playgrounds`)
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(deduped) + '\n')
  console.log(`\nWritten to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
