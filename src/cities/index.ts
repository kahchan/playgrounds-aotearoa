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
]
