import { useEffect, useRef } from 'react'
import { ArrowLeft } from '@phosphor-icons/react'
import { CITIES } from '../cities'
import { navigateToCity, navigateToLanding } from '../hooks/useCity'
import styles from './CitySwitcher.module.css'

interface Props {
  currentSlug: string
  onClose: () => void
}

export default function CitySwitcher({ currentSlug, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className={styles.panel}>
      <button
        className={styles.backBtn}
        onClick={() => { navigateToLanding(); onClose() }}
      >
        <ArrowLeft size={13} weight="bold" />
        All cities
      </button>
      <div className={styles.divider} />
      <ul className={styles.cityList}>
        {CITIES.map((city) => (
          <li key={city.slug}>
            <button
              className={`${styles.cityBtn} ${city.slug === currentSlug ? styles.cityBtnActive : ''}`}
              onClick={() => { navigateToCity(city.slug); onClose() }}
            >
              {city.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
