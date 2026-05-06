import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Sun, Moon, GlobeHemisphereWest, X,
  CaretRight, ArrowDown, ArrowUp, Crosshair,
  ArrowsClockwise, NavigationArrow, Flag,
} from '@phosphor-icons/react'

import type { Playground } from '../types'
import type { RouteMode } from '../hooks/useRoute'
import styles from './Sidebar.module.css'

interface Props {
  playgrounds: Playground[]
  isOpen: boolean
  onClose: () => void
  onSelectPlayground: (p: Playground) => void
  selectedId: string | null
  highlight?: { id: string; seq: number } | null
  routeOrder?: string[]
  pinnedEndId: string | null
  onTogglePinEnd: (id: string) => void
  pinnedStartId: string | null
  onTogglePinStart: (id: string) => void
  dark: boolean
  onToggleDark: () => void
  satellite: boolean
  onToggleSatellite: () => void
  routeMode?: RouteMode
  routeFetchState?: 'idle' | 'loading' | 'ready' | 'error'
  onSetRouteMode?: (mode: RouteMode) => void
}

interface SuburbGroup {
  suburb: string
  playgrounds: Playground[]
}

export default function Sidebar({
  playgrounds,
  isOpen,
  onClose,
  onSelectPlayground,
  selectedId,
  highlight,
  routeOrder,
  pinnedEndId,
  onTogglePinEnd,
  pinnedStartId,
  onTogglePinStart,
  dark,
  onToggleDark,
  satellite,
  onToggleSatellite,
  routeMode = 'off',
  routeFetchState = 'idle',
  onSetRouteMode,
}: Props) {
  const [expandedSuburbs, setExpandedSuburbs] = useState<Set<string>>(new Set())
  const [flashId, setFlashId] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  const suburbGroups = useMemo((): SuburbGroup[] => {
    const map = new Map<string, Playground[]>()
    for (const p of playgrounds) {
      const suburb = p.suburb ?? 'Unknown'
      if (!map.has(suburb)) map.set(suburb, [])
      map.get(suburb)!.push(p)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([suburb, pgs]) => ({
        suburb,
        playgrounds: [...pgs].sort((a, b) => a.name.localeCompare(b.name)),
      }))
  }, [playgrounds])

  useEffect(() => {
    if (suburbGroups.length > 0 && expandedSuburbs.size === 0) {
      setExpandedSuburbs(new Set(suburbGroups.map((g) => g.suburb)))
    }
  }, [suburbGroups]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!highlight) return
    const { id } = highlight

    const group = suburbGroups.find((g) => g.playgrounds.some((p) => p.id === id))
    if (group) setExpandedSuburbs((prev) => new Set([...prev, group.suburb]))

    setFlashId(id)
    const scrollTimer = setTimeout(() => {
      itemRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
    const flashTimer = setTimeout(() => setFlashId(null), 1400)
    return () => {
      clearTimeout(scrollTimer)
      clearTimeout(flashTimer)
    }
  }, [highlight?.seq]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSuburb(suburb: string) {
    setExpandedSuburbs((prev) => {
      const next = new Set(prev)
      if (next.has(suburb)) next.delete(suburb)
      else next.add(suburb)
      return next
    })
  }

  const isRouteLoading = routeFetchState === 'loading'
  const isRouteError = routeFetchState === 'error'
  const routeOn = routeMode !== 'off'
  const isCustomRoute = !!(pinnedStartId && pinnedEndId)

  const ThemeIcon = dark ? Moon : Sun
  const themeLabel = dark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerRow1}>
            <div className={styles.headerText}>
              <span className={styles.title}>Playgrounds</span>
              <span className={styles.progress}>{playgrounds.length} total</span>
            </div>
            <div className={styles.headerIcons}>
              <button
                className={styles.themeBtn}
                onClick={onToggleDark}
                aria-label={themeLabel}
              >
                <ThemeIcon size={18} weight="fill" />
              </button>
              <button
                className={`${styles.themeBtn} ${satellite ? styles.themeBtnActive : ''}`}
                onClick={onToggleSatellite}
                aria-label={satellite ? 'Switch to map view' : 'Switch to satellite view'}
              >
                <GlobeHemisphereWest size={18} weight={satellite ? 'fill' : 'regular'} />
              </button>
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close sidebar"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>
          {onSetRouteMode && (
            <div className={styles.headerRow2}>
              <button
                className={[
                  styles.routeBtn,
                  routeOn ? styles.routeBtnActive : '',
                  isRouteLoading ? styles.routeBtnLoading : '',
                  isRouteError ? styles.routeBtnError : '',
                ].filter(Boolean).join(' ')}
                onClick={() => onSetRouteMode(routeOn ? 'off' : 'north')}
                title={isRouteError ? 'Route unavailable' : routeOn ? 'Turn route off' : 'Turn route on'}
              >
                {isRouteLoading ? <ArrowsClockwise size={14} className={styles.spin} /> : null}
                Route
              </button>
              {routeOn && (
                isCustomRoute ? (
                  <span className={styles.routeDirectionCustom}>Custom</span>
                ) : (
                  <span className={styles.routeDirectionGroup}>
                    <button
                      className={`${styles.routeDirectionBtn} ${routeMode === 'north' ? styles.routeDirectionBtnActive : ''}`}
                      onClick={() => onSetRouteMode('north')}
                      title="Start from northernmost"
                    ><ArrowDown size={14} /></button>
                    <button
                      className={`${styles.routeDirectionBtn} ${routeMode === 'south' ? styles.routeDirectionBtnActive : ''}`}
                      onClick={() => onSetRouteMode('south')}
                      title="Start from southernmost"
                    ><ArrowUp size={14} /></button>
                    <button
                      className={`${styles.routeDirectionBtn} ${routeMode === 'location' ? styles.routeDirectionBtnActive : ''}`}
                      onClick={() => onSetRouteMode('location')}
                      title="Start from your location"
                    ><Crosshair size={14} /></button>
                  </span>
                )
              )}
            </div>
          )}
        </div>

        <div className={styles.body}>
          {suburbGroups.map(({ suburb, playgrounds: pgs }) => {
            const isExpanded = expandedSuburbs.has(suburb)
            return (
              <div key={suburb} className={styles.suburbSection}>
                <button
                  className={styles.suburbHeader}
                  onClick={() => toggleSuburb(suburb)}
                >
                  <CaretRight
                    size={14}
                    weight="bold"
                    className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
                  />
                  <span className={styles.suburbName}>{suburb}</span>
                  <span className={styles.suburbCount}>{pgs.length}</span>
                </button>
                {isExpanded && (
                  <ul className={styles.suburbList}>
                    {pgs.map((p) => (
                      <li
                        key={p.id}
                        ref={(el) => {
                          if (el) itemRefs.current.set(p.id, el)
                          else itemRefs.current.delete(p.id)
                        }}
                      >
                        <div
                          className={[
                            styles.item,
                            flashId === p.id ? styles.itemFlash : '',
                            selectedId === p.id ? styles.itemSelected : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <div
                            className={styles.itemMain}
                            onClick={() => onSelectPlayground(p)}
                          >
                            <span className={styles.dot} />
                            <span className={styles.itemName}>{p.name}</span>
                          </div>
                          {routeOrder && (
                            <>
                              <button
                                className={`${styles.pinStartBtn} ${pinnedStartId === p.id ? styles.pinStartBtnActive : ''}`}
                                onClick={(e) => { e.stopPropagation(); onTogglePinStart(p.id) }}
                                title={pinnedStartId === p.id ? 'Clear start point' : 'Set as route start'}
                              >
                                <NavigationArrow size={14} weight={pinnedStartId === p.id ? 'fill' : 'regular'} />
                              </button>
                              <button
                                className={`${styles.pinEndBtn} ${pinnedEndId === p.id ? styles.pinEndBtnActive : ''}`}
                                onClick={(e) => { e.stopPropagation(); onTogglePinEnd(p.id) }}
                                title={pinnedEndId === p.id ? 'Clear end point' : 'Set as route end'}
                              >
                                <Flag size={14} weight={pinnedEndId === p.id ? 'fill' : 'regular'} />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
