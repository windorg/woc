import _ from 'lodash'

/** Delete an element or several elements based on the `id` field */
export function deleteById<T, I>(xs: (T & { id: I })[], id: I | I[]) {
  const bad = Array.isArray(id) ? id : [id]
  return filterSync(xs, (x) => !bad.includes(x.id))
}

/** Find an element based on the `id` field and update it */
export function updateById<T, I>(
  xs: (T & { id: I })[],
  id: I,
  update: (x: T & { id: I }) => T & { id: I }
) {
  return xs.map((x) => (x.id === id ? update(x) : x))
}

/**  Find an element based on the `id` field and merge into it */
export function mergeById<T, I>(xs: (T & { id: I })[], patch: Partial<T> & { id: I }) {
  return updateById(xs, patch.id, (x) => ({ ...x, ...patch }))
}

export async function filterAsync<T>(
  array: readonly T[],
  callback: (value: T, index: number) => Promise<boolean>
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const results = await Promise.all(array.map((value, index) => callback(value, index)))
  // eslint-disable-next-line no-restricted-syntax
  return array.filter((_, i) => results[i])
}

export async function mapAsync<T, O>(
  array: readonly T[],
  callback: (value: T, index: number) => Promise<O>
): Promise<O[]> {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  return Promise.all(array.map((value, index) => callback(value, index)))
}

/**
 * Filter an array, and return the new array.
 *
 * Note: this is recommended over `.filter` because it has better typings.
 */
export function filterSync<T, S extends T>(
  array: readonly T[],
  predicate: (value: T, index: number) => value is S
): S[]
export function filterSync<T>(
  array: readonly T[],
  predicate: (value: T, index: number) => boolean
): T[]
export function filterSync<T>(
  array: readonly T[],
  predicate: (value: T, index: number) => boolean
): T[] {
  // eslint-disable-next-line no-restricted-syntax
  return array.filter(predicate)
}

/** Remove all values equal to `value` from the array, and return the new array. */
export function deleteSync<T>(array: readonly T[], value: T): T[] {
  // eslint-disable-next-line no-restricted-syntax
  return array.filter((x) => x !== value)
}

/** Order elements by their position in an array of ids */
export function sortByIdOrder<T, I>(
  xs: (T & { id: I })[],
  ids: I[],
  options: { onMissingElement: 'error' | 'skip' }
): (T & { id: I })[] {
  const result: (T & { id: I })[] = []
  for (const id of ids) {
    const val = xs.find((x) => x.id === id)
    if (val === undefined) {
      if (options.onMissingElement === 'error')
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`sortByIdOrder: could not find element with id ${id}`)
    } else {
      result.push(val)
    }
  }
  return result
}

export const insertPosition = <T>(val: T, order: T[], position: number) => {
  const pos = _.clamp(position, 0, order.length)
  return _.concat(_.take(order, pos), [val], _.drop(order, pos))
}

export const insertBefore = <T>(val: T, order: T[], before: T) => {
  const anchorIndex = _.findIndex(order, (x) => x === before)
  return insertPosition(val, order, anchorIndex === -1 ? 0 : anchorIndex)
}

export const insertAfter = <T>(val: T, order: T[], after: T) => {
  const anchorIndex = _.findIndex(order, (x) => x === after)
  return insertPosition(val, order, anchorIndex === -1 ? order.length : anchorIndex + 1)
}
