import deepMap from 'deep-map'
import _ from 'lodash'

// NB: this only works on JSON objects. Map, Promise, etc aren't supported.
type WocResponse<T> =
  T extends Record<string, unknown>
  ? {
    [P in keyof T]: (
      T[P] extends (infer U)[] ? WocResponse<U>[]
      : T[P] extends Readonly<infer U>[] ? Readonly<WocResponse<U>>[]
      : P extends ("createdAt" | "updatedAt") ? Date
      : WocResponse<T[P]>
    )
  }
  : T

// Convert some fields to Date, maybe do more things. Useful for HTTP responses.
export function wocResponse<T>(data: T): WocResponse<T> {
  // NB: deepMap only looks at primitive values. It's fine here.
  return deepMap(data, (val, key) => ((key === 'createdAt' || key === 'updatedAt') ? new Date(val) : val))
}

type WocQuery<T> = {
  [P in keyof T]: (
    T[P] extends ([] | Record<string, unknown>) ? string
    : WocQuery<T[P]>
  )
}

// Convert arrays and maps into JSON strings. This is what we expect for all our endpoints.
export function wocQuery<T extends Record<string, unknown>>(data: T): WocQuery<T> {
  return _.mapValues(data, (val) => _.isArray(val) || _.isObject(val) ? JSON.stringify(val) : val) as any
}

// A success|failure type for responses.
export type Result<T, E> = { success: true, data: T } | { success: false, error: E }

export class ResponseError<E = unknown> extends Error {
  data: E
  constructor(message, data: E) {
    super(message)
    this.data = data
    this.name = 'ResponseError'
  }
}