// NB: I wasn't able to reimplement the link preloading after migrating to Next 12.3. Oh well.

import Link from "next/link"

export type WithPreload<T> = T & { preload: any }

export type PreloadContext = any

export default Link