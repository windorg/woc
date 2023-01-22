import { builder } from '../../builder'
import { prisma } from '@lib/db'
import { Card as PrismaCard } from '@prisma/client'
import { canEditCard } from '@lib/access'
import { Card } from '../../schema/card'
import { CardSettings } from '@lib/model-settings'
import _ from 'lodash'
import { addJob } from '@lib/job-queue'
import { GraphQLError } from 'graphql'

export const UpdateCardInput = builder.inputType('UpdateCardInput', {
  fields: (t) => ({
    id: t.field({ type: 'UUID', required: true }),
    title: t.string(),
    tagline: t.string(),
    private: t.boolean(),
    reverseOrder: t.boolean(),
    archived: t.boolean(),
    beeminderGoal: t.string(),
  }),
})

export const UpdateCardResult = builder.simpleObject('UpdateCardResult', {
  fields: (t) => ({
    card: t.field({ type: Card }),
  }),
})

builder.mutationField('updateCard', (t) =>
  t.field({
    type: UpdateCardResult,
    args: {
      input: t.arg({ type: UpdateCardInput, required: true }),
    },
    resolve: async (root, { input }, ctx, info) => {
      const card = await prisma.card.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          parent: { select: { ownerId: true, settings: true } },
          _count: { select: { comments: true } },
        },
      })
      if (!canEditCard(ctx.userId, card))
        throw new GraphQLError('You do not have permission to edit this card')

      let diff: Partial<PrismaCard> & { settings: Partial<CardSettings> } = {
        settings: card.settings ?? {},
      }
      if (!_.isNil(input.title)) {
        diff.title = input.title
      }
      if (!_.isNil(input.tagline)) {
        diff.tagline = input.tagline
      }
      if (!_.isNil(input.private)) {
        diff.settings.visibility = input.private ? 'private' : 'public'
      }
      if (!_.isNil(input.reverseOrder)) {
        diff.settings.reverseOrder = input.reverseOrder
      }
      if (!_.isNil(input.archived)) {
        diff.settings.archived = input.archived
      }
      if (input.beeminderGoal !== undefined) {
        // We want to allow null because that's how you remove a goal
        diff.settings.beeminderGoal = input.beeminderGoal
      }
      const newCard = await prisma.card.update({
        where: { id: input.id },
        data: diff,
      })

      if (diff.settings.beeminderGoal) {
        await addJob('beeminder-sync-card', {
          cardId: card.id,
          timestamp: Date.now(),
          commentCount: card._count.comments,
        })
      }

      return {
        card: newCard,
      }
    },
  })
)
