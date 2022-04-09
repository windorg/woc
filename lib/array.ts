import * as R from 'ramda'

// Delete an element based on the 'id' field
export function deleteById<T, I>(
  xs: (T & { id: I })[],
  id: I
) {
  return filterSync(xs, x => x.id !== id)
}

// Find an element based on the 'id' field and update it
export function updateById<T, I>(
  xs: (T & { id: I })[],
  id: I,
  update: ((x: T & { id: I }) => T & { id: I })
) {
  return xs.map(x => x.id === id ? update(x) : x)
}

// Find an element based on the 'id' field and merge into it
export function mergeById<T, I>(
  xs: (T & { id: I })[],
  patch: Partial<T> & { id: I }
) {
  return updateById(xs, patch.id, (x => ({ ...x, ...patch })))
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

// Order elements by their position in an array of ids
export function sortByIdOrder<T, I>(
  xs: (T & { id: I })[],
  ids: I[],
  options: { onMissingElement: 'error' | 'skip' },
): (T & { id: I })[] {
  const result: (T & { id: I })[] = []
  for (const id of ids) {
    const val = xs.find(x => x.id === id)
    if (val === undefined) {
      if (options.onMissingElement === 'error') throw new Error(`sortByIdOrder: could not find element with id ${id}`)
    } else {
      result.push(val)
    }
  }
  return result
}