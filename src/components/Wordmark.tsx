import { List } from '@phosphor-icons/react'
import styles from './Wordmark.module.css'

interface Props {
  total: number
  onToggleSidebar: () => void
}

export default function Wordmark({ total, onToggleSidebar }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.wordmarkStack}>
        <div className={styles.tourDe}>Playgrounds</div>
        <div className={styles.playground}>Aotearoa</div>
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
