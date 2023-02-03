import { builder } from '../builder'
import { Visibility as BackendVisibility } from '@lib/model-settings'

/** This corresponds to the backend `Visibility` type from model-settings. */
export const Visibility = builder.enumType('Visibility', {
  values: {
    [BackendVisibility.Private]: {
      value: BackendVisibility.Private,
    },
    [BackendVisibility.Public]: {
      value: BackendVisibility.Public,
    },
  },
})
