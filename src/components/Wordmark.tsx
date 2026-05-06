import { useState } from 'react'
import { List } from '@phosphor-icons/react'
import type { City } from '../cities'
import CitySwitcher from './CitySwitcher'
import styles from './Wordmark.module.css'

interface Props {
  city: City
  total: number
  onToggleSidebar: () => void
}

export default function Wordmark({ city, total, onToggleSidebar }: Props) {
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <div className={styles.container}>
      <div className={styles.wordmarkWrap}>
        <button
          className={styles.wordmarkStack}
          onClick={() => setSwitcherOpen((o) => !o)}
          aria-label="Switch city"
        >
          <div className={styles.tourDe}>Playgrounds</div>
          <div className={styles.playground}>{city.label}</div>
        </button>
        {switcherOpen && (
          <CitySwitcher
            currentSlug={city.slug}
            onClose={() => setSwitcherOpen(false)}
          />
        )}
      </div>
      <button
        className={styles.iconBtn}
        onClick={onToggleSidebar}
        aria-label="Toggle playground list"
      >
        <List size={18} weight="bold" />
        <span className={styles.count}>{total}</span>
      </button>
    </div>
  )
}
