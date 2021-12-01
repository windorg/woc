import { cardSettings } from "../lib/model-settings"
import { Badge, Card as BSCard } from 'react-bootstrap'
import Link from 'next/link'
import { Card } from "@prisma/client"

type Card_ = Card & { _count: { cardUpdates: number } }

// A card, e.g. in a board view.
export function CardCard({ card }: { card: Card_ }) {
  const isPrivate = cardSettings(card).visibility === 'private'
  return (
    <BSCard className={`mb-2 woc-card ${isPrivate ? "woc-card-private" : ""}`}>
      <BSCard.Body>
        {isPrivate ? "🔒 " : ""}
        <Link href={`/ShowCard?cardId=${card.id}`}><a className="stretched-link">{card.title}</a></Link>
        <Badge pill style={{ marginLeft: ".5em" }} bg="secondary">{card._count.cardUpdates}</Badge>
      </BSCard.Body>
    </BSCard>
  )
}
