#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'playgrounds.json')

const WCC_ENDPOINT =
  'https://gis.wcc.govt.nz/arcgis/rest/services/Parks/Parks/MapServer/49/query' +
  '?where=1%3D1&outFields=*&f=geojson'

async function fetchPlaygrounds() {
  const res = await fetch(WCC_ENDPOINT)
  if (!res.ok)
    throw new Error(`WCC fetch failed: ${res.status} ${res.statusText}`)
  return res.json()
}

function toPlayground(feature) {
  const { properties, geometry } = feature
  const [lng, lat] = geometry.coordinates
  const suburb = properties.Within_Location
    ? (properties.Within_Location.split('\\')[1] ?? null)
    : null
  return {
    id: `wcc-${properties.OBJECTID}`,
    name: properties.Asset_Description ?? `Playground ${properties.OBJECTID}`,
    lat,
    lng,
    suburb,
    source: 'wcc',
  }
}

function loadExisting() {
  try {
    return JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
  } catch {
    return []
  }
}

function merge(existing, incoming) {
  const existingById = new Map(existing.map((p) => [p.id, p]))
  const incomingIds = new Set(incoming.map((p) => p.id))

  const added = []
  const updated = []
  const removed = []

  const merged = incoming.map((fresh) => {
    const prev = existingById.get(fresh.id)
    if (!prev) {
      added.push(fresh.name)
      return fresh
    }
    const next = {
      ...fresh,
      suburb: fresh.suburb ?? prev.suburb ?? null,
    }
    if (
      prev.name !== fresh.name ||
      prev.lat !== fresh.lat ||
      prev.lng !== fresh.lng
    ) {
      updated.push(fresh.name)
    }
    return next
  })

  for (const prev of existing) {
    if (!incomingIds.has(prev.id)) {
      removed.push(prev.name)
    }
  }

  return { merged, added, updated, removed }
}

async function main() {
  console.log('Fetching WCC playground data…')
  const geojson = await fetchPlaygrounds()

  if (!geojson.features?.length) {
    throw new Error('No features returned — check the endpoint URL')
  }
  console.log(`  ${geojson.features.length} features received`)

  if (process.argv.includes('--inspect')) {
    console.log('\nFirst feature properties:')
    console.log(JSON.stringify(geojson.features[0].properties, null, 2))
    console.log('\nFirst feature geometry:')
    console.log(JSON.stringify(geojson.features[0].geometry, null, 2))
    process.exit(0)
  }

  const incoming = geojson.features
    .filter((f) => f.geometry?.type === 'Point')
    .map(toPlayground)

  const existing = loadExisting()
  const { merged, added, updated, removed } = merge(existing, incoming)

  writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2) + '\n')

  console.log('\nDiff summary:')
  console.log(`  + ${added.length} added`)
  if (added.length) added.forEach((n) => console.log(`      ${n}`))
  console.log(`  ~ ${updated.length} updated`)
  if (updated.length) updated.forEach((n) => console.log(`      ${n}`))
  console.log(`  - ${removed.length} removed from source`)
  if (removed.length) removed.forEach((n) => console.log(`      ${n}`))
  console.log(`\n  Total: ${merged.length} playgrounds`)
  console.log(`\nWritten to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
