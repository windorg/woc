import { Card } from "@prisma/client"
import { prisma } from "@lib/db"
import axios from "axios"
import { cardSettings, userSettings } from "@lib/model-settings"

export type BeeminderSyncCardPayload = {
  cardId: Card['id']
  // In milliseconds (like Date.now()); Beeminder requires seconds but it will be converted in 'beeminderSyncCard'
  timestamp: number
  commentCount: number
}

// https://api.beeminder.com/#postdata
export async function beeminderSyncCard(payload: BeeminderSyncCardPayload) {
  const card = await prisma.card.findUnique({
    where: { id: payload.cardId },
    include: {
      owner: true,
    },
    rejectOnNotFound: true,
  })
  const { beeminderUsername, beeminderAccessToken } = userSettings(card.owner)
  const beeminderGoal = cardSettings(card).beeminderGoal
  if (!beeminderUsername) throw new Error(`No Beeminder user for user ${card.owner.id}`)
  if (!beeminderAccessToken) throw new Error(`No Beeminder access token for user ${card.owner.id}`)
  if (!beeminderGoal) throw new Error(`No Beeminder goal for card ${card.id}`)
  await axios.post(
    `https://www.beeminder.com/api/v1/users/${beeminderUsername}/goals/${beeminderGoal}/datapoints.json`,
    {
      access_token: beeminderAccessToken,
      value: payload.commentCount,
      timestamp: Math.floor(payload.timestamp / 1000),
      comment: 'Auto-posted by WOC',
    },
  ).catch(error => {
    if (error.response) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Beeminder error: status = ${error.response.status}, data = ${JSON.stringify(error.response.data)}, headers = ${JSON.stringify(error.response.headers)}`)
    } else {
      throw new Error(`Beeminder error: ${JSON.stringify(error)}`)
    }
  })
}