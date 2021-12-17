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