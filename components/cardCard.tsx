import { cardSettings } from "../lib/model-settings"
import * as B from 'react-bootstrap'
import Link from 'next/link'
import { Card } from "@prisma/client"
import { cardRoute } from "lib/routes"
import { LinkPreload } from "lib/link-preload"
import styles from './cardCard.module.scss'

type Card_ = Card & { _count: { comments: number } }

// A card, e.g. in a board view.
export function CardCard({ card }: { card: Card_ }) {
  const isPrivate = cardSettings(card).visibility === 'private'
  return (
    <B.Card className={`mb-2 woc-card ${isPrivate ? "woc-card-private" : ""}`}>
      <B.Card.Body>
        <div>
          {isPrivate ? "🔒 " : ""}
          <LinkPreload href={cardRoute(card.id)}><a className="stretched-link">{card.title}</a></LinkPreload>
          <B.Badge pill style={{ marginLeft: ".5em" }} bg="secondary">{card._count.comments}</B.Badge>
        </div>
        {card.tagline &&
          <div className={styles.tagline}>
            <span className="text-muted small">{card.tagline}</span>
          </div>
        }
      </B.Card.Body>
    </B.Card>
  )
}
