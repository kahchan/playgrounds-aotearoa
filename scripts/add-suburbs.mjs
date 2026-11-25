#!/usr/bin/env node
/**
 * Adds suburb (and refreshes names) for all city JSON files that lack suburb data.
 * Queries Overpass for localities and playground names, writes in-place.
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
]
const HEADERS = { 'User-Agent': 'playgrounds-aotearoa/1.0 (https://github.com/kahchan/playgrounds-aotearoa)' }

const CITIES = {
  'dunedin':         '-45.9693,170.0779,-45.4853,170.7454',
  'gisborne':        '-38.7195,177.5148,-37.5724,178.4332',
  'hamilton':        '-37.8489,175.1999,-37.7004,175.3532',
  'invercargill':    '-46.6226,168.2703,-46.3400,168.4375',
  'lower-hutt':      '-41.3231,174.8470,-41.1372,175.0094',
  'nelson':          '-41.3595,173.1925,-41.1658,173.3816',
  'new-plymouth':    '-39.2127,173.8604,-38.9709,174.4113',
  'palmerston-north':'-40.4502,175.5314,-40.2621,175.7768',
  'porirua':         '-41.1646,174.8071,-41.0136,174.9544',
  'rotorua':         '-38.1845,176.1752,-38.0470,176.3281',
  'tauranga':        '-37.7898,176.0744,-37.6145,176.3692',
  'upper-hutt':      '-41.1719,174.9915,-41.0717,175.1534',
  'whanganui':       '-39.9642,174.8821,-39.8308,175.1341',
  'whangarei':       '-35.7945,174.2676,-35.6538,174.3787',
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function overpass(query) {
  for (const server of OVERPASS_SERVERS) {
    try {
      const url = new URL(server)
      url.searchParams.set('data', query.trim())
      const res = await fetch(url.toString(), { headers: HEADERS, signal: AbortSignal.timeout(30000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${server}`)
      return res.json()
    } catch (e) {
      console.log(`    trying next server: ${e.message}`)
      await sleep(2000)
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

async function processCity(slug, bbox) {
  const path = join(PUBLIC, `${slug}.json`)
  const existing = JSON.parse(readFileSync(path, 'utf8'))

  console.log(`\n${slug}: ${existing.length} playgrounds`)

  // Build lookup of existing names by id
  const existingById = Object.fromEntries(existing.map(p => [p.id, p]))

  // Fetch localities
  const locData = await overpass(`
    [out:json][timeout:25];
    node["place"~"suburb|locality|village|town|neighbourhood|hamlet"](${bbox});
    out body;
  `)
  await sleep(1000)

  const localities = locData.elements
    .filter(e => e.tags?.name)
    .map(e => ({ name: e.tags.name, lat: e.lat, lng: e.lon }))
  console.log(`  ${localities.length} localities`)

  // Fetch playgrounds (to get names)
  const pgData = await overpass(`
    [out:json][timeout:30];
    (
      node["leisure"="playground"](${bbox});
      way["leisure"="playground"](${bbox});
      relation["leisure"="playground"](${bbox});
    );
    out center;
  `)
  await sleep(1000)

  // Build name lookup from fresh OSM data
  const nameById = {}
  for (const el of pgData.elements) {
    const id = `osm-${el.type[0]}${el.id}`
    const osmName = el.tags?.name
    if (osmName) nameById[id] = osmName
  }
  const namedCount = Object.keys(nameById).length
  console.log(`  ${namedCount} playgrounds with names in OSM`)

  // Update each playground: suburb + name if OSM has one
  const updated = existing.map(p => {
    const suburb = nearestLocality(p.lat, p.lng, localities)?.name ?? null
    const name = nameById[p.id] ?? p.name  // keep existing if no OSM name
    return { ...p, name, suburb }
  })

  writeFileSync(path, JSON.stringify(updated) + '\n')
  const withSuburb = updated.filter(p => p.suburb).length
  const withName = updated.filter(p => p.name !== 'Playground').length
  console.log(`  → suburb: ${withSuburb}/${updated.length}, named: ${withName}/${updated.length}`)
}

async function main() {
  const target = process.argv[2]
  const cities = target ? { [target]: CITIES[target] } : CITIES
  if (target && !CITIES[target]) {
    console.error(`Unknown city: ${target}. Valid: ${Object.keys(CITIES).join(', ')}`)
    process.exit(1)
  }

  for (const [slug, bbox] of Object.entries(cities)) {
    try {
      await processCity(slug, bbox)
    } catch (e) {
      console.error(`  FAILED: ${e.message}`)
    }
    await sleep(2000)
  }
  console.log('\nDone.')
}

main().catch(e => { console.error(e.message); process.exit(1) })
