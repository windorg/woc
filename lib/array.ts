import * as R from 'ramda'

// Delete an element based on the 'id' field
export function deleteById<T, I>(
  xs: (T & { id: I })[],
  id: I
) {
  return R.filter(x => x.id !== id, xs)
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