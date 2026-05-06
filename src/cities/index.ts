export interface City {
  slug: string
  label: string
  center: [number, number] // [lng, lat]
  zoom: number
  dataPath: string
}

export const CITIES: City[] = [
  {
    slug: 'wellington',
    label: 'Wellington',
    center: [174.7762, -41.2865],
    zoom: 12,
    dataPath: 'wellington.json',
  },
  {
    slug: 'kapiti',
    label: 'Kāpiti',
    center: [175.0633, -40.8994],
    zoom: 11,
    dataPath: 'kapiti.json',
  },
  {
    slug: 'hawkes-bay',
    label: "Hawke's Bay",
    center: [176.8786, -39.5667],
    zoom: 11,
    dataPath: 'hawkes-bay.json',
  },
  {
    slug: 'christchurch',
    label: 'Christchurch',
    center: [172.6362, -43.5321],
    zoom: 12,
    dataPath: 'christchurch.json',
  },
  {
    slug: 'auckland',
    label: 'Auckland',
    center: [174.7633, -36.8485],
    zoom: 11,
    dataPath: 'auckland.json',
  },
]
