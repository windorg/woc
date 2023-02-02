import { builder } from '../builder'

/** Card, comment, reply visibility */
export enum Visibility {
  /** Anyone can see this */
  Public = 'public',
  /** Only the author can see this */
  Private = 'private',
}

builder.enumType(Visibility, {
  name: 'Visibility',
})
