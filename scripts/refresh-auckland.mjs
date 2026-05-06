#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = join(__dirname, '..', 'public', 'auckland.json')

// Park Asset Location — filter to playground asset types
const AC_BASE =
  'https://services1.arcgis.com/n4yPwebTjJCmXB6W/arcgis/rest/services/Park_Asset_Location/FeatureServer/0/query'
const FILTER = encodeURIComponent(
  "AssetType LIKE 'Playground%' OR AssetType LIKE 'Playspace%'",
)
const FIELDS = 'OBJECTID,AssetType,SITE,SITEDESCRIPTION,LOCALBOARD'

async function fetchPage(offset) {
  const url =
    `${AC_BASE}?where=${FILTER}&outFields=${FIELDS}&returnGeometry=true` +
    `&outSR=4326&f=geojson&resultOffset=${offset}&resultRecordCount=1000`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`AC fetch failed: ${res.status}`)
  return res.json()
}

function toPlayground(feature) {
  const p = feature.properties
  const [lng, lat] = feature.geometry.coordinates
  return {
    id: `ac-${p.SITE}-${p.OBJECTID}`,
    name: p.SITEDESCRIPTION ?? 'Playground',
    lat,
    lng,
    suburb: p.LOCALBOARD ?? null,
    source: 'ac',
  }
}

async function main() {
  console.log('Fetching Auckland playground data from Auckland Council…')

  const all = []
  let offset = 0
  while (true) {
    const page = await fetchPage(offset)
    const features = page.features ?? []
    all.push(...features)
    console.log(`  Fetched ${all.length} records…`)
    if (!page.properties?.exceededTransferLimit) break
    offset += features.length
  }

  const playgrounds = all.map(toPlayground)

  // Deduplicate by SITE — same park can have multiple asset type records
  const seen = new Set()
  const deduped = playgrounds.filter((p) => {
    const siteKey = p.id.split('-').slice(0, 2).join('-')
    if (seen.has(siteKey)) return false
    seen.add(siteKey)
    return true
  })

  if (deduped.length < playgrounds.length) {
    console.log(`  Deduplicated ${playgrounds.length - deduped.length} same-site duplicates → ${deduped.length}`)
  } else {
    console.log(`  ${deduped.length} playgrounds`)
  }

  const boards = [...new Set(deduped.map((p) => p.suburb))].sort()
  console.log(`  Local boards: ${boards.join(', ')}`)

  writeFileSync(OUTPUT_PATH, JSON.stringify(deduped, null, 2) + '\n')
  console.log(`\nWritten to ${OUTPUT_PATH}`)
  console.log('Review, then: git add public/auckland.json && git commit')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
