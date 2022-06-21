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
    // TODO: move .woc-card-private into scss module
    <div className={`${styles.cardsListItem} woc-card ${isPrivate ? "woc-card-private" : ""} ${dragged ? styles._dragged : ""}`}>
      <div>
        {isPrivate ? "🔒 " : ""}
        {dragged
          ? <a className="stretched-link">{card.title}</a>
          : <LinkPreload href={cardRoute(card.id)}><a className="stretched-link">{card.title}</a></LinkPreload>
        }
        <B.Badge pill style={{ marginLeft: ".5em" }} bg="secondary">{card._count.comments}</B.Badge>
      </div>
      {card.tagline &&
        <div className={styles._tagline}>
          <span className="text-muted small">{card.tagline}</span>
        </div>
      }
    </div>
  )
}
