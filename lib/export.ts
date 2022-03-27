import { NextPageContext } from 'next'
import _ from 'lodash'

// Detect 'next export'. We can't call any server-side functions during 'next export'.
export function isNextExport(ctx: NextPageContext): boolean {
  return typeof window === 'undefined' && (ctx.req === undefined || _.isEmpty(ctx.req.headers))
}
