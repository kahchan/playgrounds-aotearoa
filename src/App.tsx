import { useEffect, useState } from 'react'
import type { Playground } from './types'
import type { City } from './cities'
import { useCity } from './hooks/useCity'
import { useDarkMode } from './hooks/useDarkMode'
import { useRoute } from './hooks/useRoute'
import MapView from './components/MapView'
import Wordmark from './components/Wordmark'
import Sidebar from './components/Sidebar'
import Landing from './components/Landing'
import styles from './App.module.css'

export default function App() {
  const city = useCity()
  if (!city) return <Landing />
  return <CityMap key={city.slug} city={city} />
}

function CityMap({ city }: { city: City }) {
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const { mapTheme, dark, toggleDark, toggleSatellite, satellite } = useDarkMode()
  const [selected, setSelected] = useState<Playground | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pinnedEndId, setPinnedEndId] = useState<string | null>(null)
  const [pinnedStartId, setPinnedStartId] = useState<string | null>(null)
  const [sidebarHighlight, setSidebarHighlight] = useState<{ id: string; seq: number } | null>(null)
  const [mapFlyTarget, setMapFlyTarget] = useState<{
    lat: number
    lng: number
    nextLat?: number
    nextLng?: number
    legIndex?: number
    seq: number
  } | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}${city.dataPath}`)
      .then((r) => r.json())
      .then((data: Playground[]) => setPlaygrounds(data))
      .catch((err) => console.error('Failed to load playgrounds:', err))
  }, [city.dataPath])

  const {
    mode: routeMode,
    setMode: setRouteMode,
    fetchState: routeFetchState,
    geoJSON: routeGeoJSON,
    orderedIds: routeOrderedIds,
  } = useRoute(playgrounds, pinnedEndId, pinnedStartId)

  function handleMarkerClick(playground: Playground) {
    setSelected(playground)
    setSidebarOpen(true)
    setSidebarHighlight((prev) => ({ id: playground.id, seq: (prev?.seq ?? 0) + 1 }))
  }

  function handleSidebarSelect(playground: Playground) {
    if (selected?.id === playground.id) {
      setSelected(null)
      return
    }
    setSelected(playground)
    const routeIdx = routeOrderedIds.indexOf(playground.id)
    const nextId = routeIdx >= 0 ? routeOrderedIds[routeIdx + 1] : undefined
    const nextPg = nextId ? playgrounds.find((p) => p.id === nextId) : undefined
    setMapFlyTarget((prev) => ({
      lat: playground.lat,
      lng: playground.lng,
      nextLat: nextPg?.lat,
      nextLng: nextPg?.lng,
      legIndex: routeIdx >= 0 ? routeIdx : undefined,
      seq: (prev?.seq ?? 0) + 1,
    }))
  }

  return (
    <div className={styles.app}>
      <MapView
        playgrounds={playgrounds}
        onMarkerClick={handleMarkerClick}
        mapTheme={mapTheme}
        routeGeoJSON={routeGeoJSON}
        routeOrder={routeOrderedIds}
        selectedId={selected?.id ?? null}
        flyTarget={mapFlyTarget}
        center={city.center}
        zoom={city.zoom}
      />
      <Wordmark
        city={city}
        total={playgrounds.length}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
      />
      <Sidebar
        playgrounds={playgrounds}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectPlayground={handleSidebarSelect}
        selectedId={selected?.id ?? null}
        highlight={sidebarHighlight}
        routeOrder={routeOrderedIds.length > 0 ? routeOrderedIds : undefined}
        pinnedEndId={pinnedEndId}
        onTogglePinEnd={(id) => setPinnedEndId((prev) => (prev === id ? null : id))}
        pinnedStartId={pinnedStartId}
        onTogglePinStart={(id) => setPinnedStartId((prev) => (prev === id ? null : id))}
        dark={dark}
        onToggleDark={toggleDark}
        satellite={satellite}
        onToggleSatellite={toggleSatellite}
        routeMode={routeMode}
        routeFetchState={routeFetchState}
        onSetRouteMode={import.meta.env.VITE_ORS_KEY ? setRouteMode : undefined}
      />
    </div>
  )
}
