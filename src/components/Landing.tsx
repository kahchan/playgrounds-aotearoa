import { useEffect, useState } from 'react'
import { CITIES } from '../cities'
import { navigateToCity } from '../hooks/useCity'
import styles from './Landing.module.css'

export default function Landing() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    for (const city of CITIES) {
      fetch(`${import.meta.env.BASE_URL}${city.dataPath}`)
        .then((r) => r.json())
        .then((data: unknown[]) =>
          setCounts((prev) => ({ ...prev, [city.slug]: data.length })),
        )
        .catch(() => {})
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.wordmark}>
          <div className={styles.wordmarkTop}>Playgrounds</div>
          <div className={styles.wordmarkBottom}>Aotearoa</div>
        </div>

        <p className={styles.blurb}>
          Explore playgrounds across Aotearoa. Pick a city, browse on a map,
          and optionally generate a road-driving tour.
        </p>

        <p className={styles.byline}>
          Built by a designer who likes building.{' '}
          <a
            href="https://www.linkedin.com/in/kahchan"
            target="_blank"
            rel="noreferrer"
          >
            Find me on LinkedIn.
          </a>
        </p>

        <div className={styles.divider} />

        <div className={styles.cities}>
          {CITIES.map((city) => (
            <button
              key={city.slug}
              className={styles.cityCard}
              onClick={() => navigateToCity(city.slug)}
            >
              <span className={styles.cityName}>{city.label}</span>
              {counts[city.slug] !== undefined && (
                <span className={styles.cityCount}>{counts[city.slug]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
