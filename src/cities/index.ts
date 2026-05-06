export interface City {
  slug: string
  label: string
  center: [number, number] // [lng, lat]
  zoom: number
  dataPath: string
}

export const CITIES: City[] = [
  // North Island — north to south
  {
    slug: 'whangarei',
    label: 'Whangārei',
    center: [174.3189, -35.7163],
    zoom: 13,
    dataPath: 'whangarei.json',
  },
  {
    slug: 'auckland-north',
    label: 'Auckland North',
    center: [174.7071, -36.6910],
    zoom: 10,
    dataPath: 'auckland-north.json',
  },
  {
    slug: 'auckland-central',
    label: 'Auckland Central',
    center: [174.7088, -36.8846],
    zoom: 11,
    dataPath: 'auckland-central.json',
  },
  {
    slug: 'auckland-south',
    label: 'Auckland South',
    center: [174.8856, -37.0037],
    zoom: 11,
    dataPath: 'auckland-south.json',
  },
  {
    slug: 'tauranga',
    label: 'Tauranga',
    center: [176.2016, -37.7069],
    zoom: 12,
    dataPath: 'tauranga.json',
  },
  {
    slug: 'hamilton',
    label: 'Hamilton',
    center: [175.2665, -37.7665],
    zoom: 12,
    dataPath: 'hamilton.json',
  },
  {
    slug: 'rotorua',
    label: 'Rotorua',
    center: [176.2461, -38.1361],
    zoom: 13,
    dataPath: 'rotorua.json',
  },
  {
    slug: 'gisborne',
    label: 'Gisborne',
    center: [178.0577, -38.5234],
    zoom: 13,
    dataPath: 'gisborne.json',
  },
  {
    slug: 'new-plymouth',
    label: 'New Plymouth',
    center: [174.1084, -39.0721],
    zoom: 13,
    dataPath: 'new-plymouth.json',
  },
  {
    slug: 'hawkes-bay',
    label: "Hawke's Bay",
    center: [176.8786, -39.5667],
    zoom: 11,
    dataPath: 'hawkes-bay.json',
  },
  {
    slug: 'whanganui',
    label: 'Whanganui',
    center: [175.0067, -39.9232],
    zoom: 13,
    dataPath: 'whanganui.json',
  },
  {
    slug: 'palmerston-north',
    label: 'Palmerston North',
    center: [175.6231, -40.3574],
    zoom: 13,
    dataPath: 'palmerston-north.json',
  },
  {
    slug: 'kapiti',
    label: 'Kāpiti',
    center: [175.0633, -40.8994],
    zoom: 11,
    dataPath: 'kapiti.json',
  },
  {
    slug: 'porirua',
    label: 'Porirua',
    center: [174.8658, -41.1134],
    zoom: 13,
    dataPath: 'porirua.json',
  },
  {
    slug: 'upper-hutt',
    label: 'Upper Hutt',
    center: [175.0741, -41.1187],
    zoom: 12,
    dataPath: 'upper-hutt.json',
  },
  {
    slug: 'lower-hutt',
    label: 'Lower Hutt',
    center: [174.9288, -41.2161],
    zoom: 12,
    dataPath: 'lower-hutt.json',
  },
  {
    slug: 'wellington',
    label: 'Wellington',
    center: [174.7762, -41.2865],
    zoom: 12,
    dataPath: 'wellington.json',
  },
  // South Island — north to south
  {
    slug: 'nelson',
    label: 'Nelson',
    center: [173.2691, -41.2816],
    zoom: 13,
    dataPath: 'nelson.json',
  },
  {
    slug: 'christchurch',
    label: 'Christchurch',
    center: [172.6362, -43.5321],
    zoom: 12,
    dataPath: 'christchurch.json',
  },
  {
    slug: 'dunedin',
    label: 'Dunedin',
    center: [170.4841, -45.8587],
    zoom: 12,
    dataPath: 'dunedin.json',
  },
  {
    slug: 'invercargill',
    label: 'Invercargill',
    center: [168.3537, -46.4140],
    zoom: 13,
    dataPath: 'invercargill.json',
  },
]
