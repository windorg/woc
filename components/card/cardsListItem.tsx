import { cardSettings } from "../../lib/model-settings"
import * as B from 'react-bootstrap'
import { Card } from "@prisma/client"
import { cardRoute } from "lib/routes"
import { LinkPreload } from "lib/link-preload"
import styles from './shared.module.scss'

type Card_ = Pick<Card, "id" | "title" | "tagline" | "settings"> & { _count: { comments: number } }

// A card in the sub-cards list
export function CardsListItem(props: {
  // Whether the card is being dragged in a list
  dragged?: boolean
  card: Card_
}) {
  const { card } = props
  const dragged = props?.dragged ?? false
  const isPrivate = cardSettings(card).visibility === 'private'
  return (
    // NB: .position-relative is needed for .stretched-link to work properly
    <div className={`${styles.cardsListItem} woc-card position-relative ${dragged ? styles._dragged : ""}`}>
      <div className={styles._counter}>
        {card._count.comments || "−"}
      </div>
      <div className={styles._body}>
        <div>
          {isPrivate ? "🔒 " : ""}
          {dragged
            ? <a className="stretched-link">{card.title}</a>
            : <LinkPreload href={cardRoute(card.id)}><a className="stretched-link">{card.title}</a></LinkPreload>
          }
        </div>
        {card.tagline &&
          <div className={styles._tagline}>
            {card.tagline}
          </div>
        }
      </div>
    </div>
  )
}
