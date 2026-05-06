import { useSyncExternalStore } from 'react'
import { CITIES, type City } from '../cities'

function getSnapshot() {
  return window.location.hash
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useCity(): City | null {
  const hash = useSyncExternalStore(subscribe, getSnapshot)
  const slug = hash.slice(2) // '#/wellington' → 'wellington', '#/' → ''
  return CITIES.find((c) => c.slug === slug) ?? null
}

export function navigateToCity(slug: string) {
  window.location.hash = '#/' + slug
}

export function navigateToLanding() {
  window.location.hash = '#/'
}
