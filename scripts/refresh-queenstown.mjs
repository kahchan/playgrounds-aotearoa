#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'queenstown.json')

// Queenstown-Lakes urban area (Queenstown, Frankton, Kelvin Heights, Fernhill, Arthurs Point)
const BBOX = '-45.08,168.60,-44.97,168.78'

const SERVERS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const HEADERS = { 'User-Agent': 'playgrounds-aotearoa/1.0 (https://github.com/kahchan/playgrounds-aotearoa)' }

async function overpassQuery(query) {
  for (const server of SERVERS) {
    try {
      const res = await fetch(server, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query.trim()),
        signal: AbortSignal.timeout(120000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    } catch (e) {
      console.log(`  ${new URL(server).hostname}: ${e.message}`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }
  throw new Error('All Overpass servers failed')
}

function nearestLocality(lat, lng, localities) {
  let best = null, bestDist = Infinity
  for (const loc of localities) {
    const dlat = lat - loc.lat
    const dlng = (lng - loc.lng) * Math.cos((lat * Math.PI) / 180)
    const dist = dlat * dlat + dlng * dlng
    if (dist < bestDist) { bestDist = dist; best = loc }
  }
  return best
}

async function main() {
  console.log('Fetching Queenstown playgrounds from OpenStreetMap…')
  const pgData = await overpassQuery(`
      [out:json][timeout:30];
      (
        node["leisure"="playground"](${BBOX});
        way["leisure"="playground"](${BBOX});
        relation["leisure"="playground"](${BBOX});
      );
      out center;
    `)
  await new Promise(r => setTimeout(r, 2000))
  const locData = await overpassQuery(`
      [out:json][timeout:30];
      node["place"~"suburb|locality|village|town|neighbourhood|hamlet"](${BBOX});
      out body;
    `)

  const localities = locData.elements
    .filter(e => e.tags?.name)
    .map(e => ({ name: e.tags.name, lat: e.lat, lng: e.lon }))
  console.log(`  ${localities.length} locality nodes`)

  const playgrounds = pgData.elements
    .map(el => {
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

  const ways = playgrounds.filter(p => !p.id.startsWith('osm-n'))
  const deduped = playgrounds.filter(p => {
    if (!p.id.startsWith('osm-n')) return true
    return !ways.some(w => {
      const dlat = p.lat - w.lat
      const dlng = (p.lng - w.lng) * Math.cos((p.lat * Math.PI) / 180)
      return dlat * dlat + dlng * dlng < 3.3e-8
    })
  })

  console.log(`  ${deduped.length} playgrounds (deduped from ${playgrounds.length})`)
  writeFileSync(OUTPUT_PATH, JSON.stringify(deduped) + '\n')
  console.log(`Written to ${OUTPUT_PATH}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
