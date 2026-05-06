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
]
