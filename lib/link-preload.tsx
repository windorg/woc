/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-floating-promises */

// Copied from https://github.com/vercel/next.js/blob/canary/packages/next/client/link.tsx on Jan 10, 2022, using commit
// '6581ba9daeebb722056f457f5b50e4236b9edcd3'. The modified bits are marked with "// WOC".

// Like next/link, but preloads the page's data as well. Requires the page to implement a 'preload' method.

import React from 'react'
import { UrlObject } from 'url'
import {
  addBasePath,
  addLocale,
  delBasePath,
  delLocale,
  getDomainLocale,
  isLocalURL,
  NextRouter,
  PrefetchOptions,
  resolveHref,
} from 'next/dist/shared/lib/router/router'
import { useRouter } from 'next/router'
import { useIntersection } from 'next/dist/client/use-intersection'
import singletonRouter from 'next/router'
import { parseRelativeUrl } from 'next/dist/shared/lib/router/utils/parse-relative-url'
import { normalizeLocalePath } from 'next/dist/shared/lib/i18n/normalize-locale-path'
import { formatWithValidation } from 'next/dist/shared/lib/utils'
import { getClientBuildManifest } from 'next/dist/client/route-loader'
import { removePathTrailingSlash } from 'next/dist/client/normalize-trailing-slash'
import resolveRewrites from 'next/dist/shared/lib/router/utils/resolve-rewrites'
import { denormalizePagePath } from 'next/dist/server/denormalize-page-path'
import { getRouteRegex, isDynamicRoute } from 'next/dist/shared/lib/router/utils'
import { ParsedUrlQuery } from 'querystring'
import { QueryClient, useQueryClient } from 'react-query'
import { Session } from 'next-auth'
import { useSession } from 'next-auth/react'

type Url = string | UrlObject
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

export type LinkPreloadProps = {
  href: Url
  as?: Url
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  prefetch?: boolean
  locale?: string | false
}
type LinkPropsRequired = RequiredKeys<LinkPreloadProps>
type LinkPropsOptional = OptionalKeys<LinkPreloadProps>

const prefetched: { [cacheKey: string]: boolean } = {}

// WOC: this will be passed to page.preload()
export type PreloadContext = {
  session: Session | null
  queryClient: QueryClient
  query: ParsedUrlQuery
}

// WOC
export type WithPreload<Page> = Page & {
  preload: (context: PreloadContext) => Promise<void>
}

// WOC: copied from next/router
function resolveDynamicRoute(pathname: string, pages: string[]) {
  const cleanPathname = removePathTrailingSlash(denormalizePagePath(pathname!))

  if (cleanPathname === '/404' || cleanPathname === '/_error') {
    return pathname
  }

  // handle resolving href for dynamic routes
  if (!pages.includes(cleanPathname!)) {
    // eslint-disable-next-line array-callback-return
    pages.some((page) => {
      if (isDynamicRoute(page) && getRouteRegex(page).re.test(cleanPathname!)) {
        pathname = page
        return true
      }
    })
  }
  return removePathTrailingSlash(pathname)
}

// WOC: copied from next/router.prefetch() and stripped out a bunch of code
async function hrefToRoute({ url, asPath, options }): Promise<{ route, query }> {
  const router = singletonRouter.router!

  let parsed = parseRelativeUrl(url)

  let { pathname, query } = parsed

  if (process.env.__NEXT_I18N_SUPPORT) {
    if (options.locale === false) {
      pathname = normalizeLocalePath!(pathname, router.locales).pathname
      parsed.pathname = pathname
      url = formatWithValidation(parsed)

      let parsedAs = parseRelativeUrl(asPath)
      const localePathResult = normalizeLocalePath!(
        parsedAs.pathname,
        router.locales
      )
      parsedAs.pathname = localePathResult.pathname
      options.locale = localePathResult.detectedLocale || router.defaultLocale
      asPath = formatWithValidation(parsedAs)
    }
  }

  const pages = await router.pageLoader.getPageList()
  let resolvedAs = asPath

  if (process.env.__NEXT_HAS_REWRITES && asPath.startsWith('/')) {
    let rewrites: any
      ; ({ __rewrites: rewrites } = await getClientBuildManifest())

    const rewritesResult = resolveRewrites(
      addBasePath(addLocale(asPath, router.locale)),
      pages,
      rewrites,
      parsed.query,
      (p: string) => resolveDynamicRoute(p, pages),
      router.locales
    )
    resolvedAs = delLocale(delBasePath(rewritesResult.asPath), router.locale)

    if (rewritesResult.matchedPage && rewritesResult.resolvedHref) {
      // if this directly matches a page we need to update the href to
      // allow the correct page chunk to be loaded
      pathname = rewritesResult.resolvedHref
      parsed.pathname = pathname
      url = formatWithValidation(parsed)
    }
  } else {
    parsed.pathname = resolveDynamicRoute(parsed.pathname, pages)

    if (parsed.pathname !== pathname) {
      pathname = parsed.pathname
      parsed.pathname = pathname
      url = formatWithValidation(parsed)
    }
  }

  const effects = await router._preflightRequest({
    as: addBasePath(asPath),
    cache: true,
    pages,
    pathname,
    query,
  })

  if (effects.type === 'rewrite') {
    parsed.pathname = effects.resolvedHref
    pathname = effects.resolvedHref
    query = { ...query, ...effects.parsedAs.query }
    resolvedAs = effects.asPath
    url = formatWithValidation(parsed)
  }

  const route = removePathTrailingSlash(pathname)

  return { route, query }
}

function prefetch(
  router: NextRouter,
  href: string,
  as: string,
  // WOC: added this
  extra: {
    queryClient: QueryClient,
    session: Session | null,
  },
  options?: PrefetchOptions,
): void {
  if (typeof window === 'undefined' || !router) return
  if (!isLocalURL(href)) return
  // Prefetch the JSON page if asked (only in the client)
  // We need to handle a prefetch error here since we may be
  // loading with priority which can reject but we don't
  // want to force navigation since this is only a prefetch

  router.prefetch(href, as, options)
    // WOC: when the page is prefetched, we call its 'preload' method.
    .then(async () => {
      if (singletonRouter.router) {
        const { route, query } = await hrefToRoute({ url: href, asPath: as, options })
        const loaded = await singletonRouter.router.pageLoader.loadPage(route)
        // @ts-expect-error: 'preload' not found
        if (loaded.page.preload && typeof loaded.page.preload === 'function') {
          const context: PreloadContext = {
            session: extra.session,
            queryClient: extra.queryClient,
            query,
          }
          // @ts-expect-error: 'preload' not found
          await loaded.page.preload(context)
        } else {
          console.error(`LinkPreload: preload() not found for ${href}`)
        }
      }
    })
    .catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        // rethrow to show invalid URL errors
        throw err
      }
    })

  const curLocale =
    options && typeof options.locale !== 'undefined'
      ? options.locale
      : router && router.locale

  // Join on an invalid URI character
  prefetched[href + '%' + as + (curLocale ? '%' + curLocale : '')] = true
}

function isModifiedEvent(event: React.MouseEvent): boolean {
  const { target } = event.currentTarget as HTMLAnchorElement
  return (
    (target && target !== '_self') ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey || // triggers resource download
    (event.nativeEvent && event.nativeEvent.which === 2)
  )
}

function linkClicked(
  e: React.MouseEvent,
  router: NextRouter,
  href: string,
  as: string,
  replace?: boolean,
  shallow?: boolean,
  scroll?: boolean,
  locale?: string | false
): void {
  const { nodeName } = e.currentTarget

  if (nodeName === 'A' && (isModifiedEvent(e) || !isLocalURL(href))) {
    // ignore click for browser’s default behavior
    return
  }

  e.preventDefault()

  //  avoid scroll for urls with anchor refs
  if (scroll == null && as.indexOf('#') >= 0) {
    scroll = false
  }

  // replace state instead of push if prop is present
  router[replace ? 'replace' : 'push'](href, as, {
    shallow,
    locale,
    scroll,
  })
}

export function LinkPreload(props: React.PropsWithChildren<LinkPreloadProps>) {
  if (process.env.NODE_ENV !== 'production') {
    function createPropError(args: {
      key: string
      expected: string
      actual: string
    }) {
      return new Error(
        `Failed prop type: The prop \`${args.key}\` expects a ${args.expected} in \`<Link>\`, but got \`${args.actual}\` instead.` +
        (typeof window !== 'undefined'
          ? "\nOpen your browser's console to view the Component stack trace."
          : '')
      )
    }

    // TypeScript trick for type-guarding:
    const requiredPropsGuard: Record<LinkPropsRequired, true> = {
      href: true,
    } as const
    const requiredProps: LinkPropsRequired[] = Object.keys(
      requiredPropsGuard
    ) as LinkPropsRequired[]
    requiredProps.forEach((key: LinkPropsRequired) => {
      if (key === 'href') {
        if (
          props[key] == null ||
          (typeof props[key] !== 'string' && typeof props[key] !== 'object')
        ) {
          throw createPropError({
            key,
            expected: '`string` or `object`',
            actual: props[key] === null ? 'null' : typeof props[key],
          })
        }
      } else {
        // TypeScript trick for type-guarding:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = key
      }
    })

    // TypeScript trick for type-guarding:
    const optionalPropsGuard: Record<LinkPropsOptional, true> = {
      as: true,
      replace: true,
      scroll: true,
      shallow: true,
      passHref: true,
      prefetch: true,
      locale: true,
    } as const
    const optionalProps: LinkPropsOptional[] = Object.keys(
      optionalPropsGuard
    ) as LinkPropsOptional[]
    optionalProps.forEach((key: LinkPropsOptional) => {
      const valType = typeof props[key]

      if (key === 'as') {
        if (props[key] && valType !== 'string' && valType !== 'object') {
          throw createPropError({
            key,
            expected: '`string` or `object`',
            actual: valType,
          })
        }
      } else if (key === 'locale') {
        if (props[key] && valType !== 'string') {
          throw createPropError({
            key,
            expected: '`string`',
            actual: valType,
          })
        }
      } else if (
        key === 'replace' ||
        key === 'scroll' ||
        key === 'shallow' ||
        key === 'passHref' ||
        key === 'prefetch'
      ) {
        if (props[key] != null && valType !== 'boolean') {
          throw createPropError({
            key,
            expected: '`boolean`',
            actual: valType,
          })
        }
      } else {
        // TypeScript trick for type-guarding:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = key
      }
    })

    // This hook is in a conditional but that is ok because `process.env.NODE_ENV` never changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hasWarned = React.useRef(false)
    if (props.prefetch && !hasWarned.current) {
      hasWarned.current = true
      console.warn(
        'Next.js auto-prefetches automatically based on viewport. The prefetch attribute is no longer needed. More: https://nextjs.org/docs/messages/prefetch-true-deprecated'
      )
    }
  }
  const p = props.prefetch !== false
  const router = useRouter()

  const { href, as } = React.useMemo(() => {
    const [resolvedHref, resolvedAs] = resolveHref(router, props.href, true)
    return {
      href: resolvedHref,
      as: props.as ? resolveHref(router, props.as) : resolvedAs || resolvedHref,
    }
  }, [router, props.href, props.as])

  let { children, replace, shallow, scroll, locale } = props

  if (typeof children === 'string') {
    children = <a>{children}</a>
  }

  // This will return the first child, if multiple are provided it will throw an error
  let child: any
  if (process.env.NODE_ENV === 'development') {
    try {
      child = React.Children.only(children)
    } catch (err) {
      throw new Error(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `Multiple children were passed to <Link> with \`href\` of \`${props.href}\` but only one child is supported https://nextjs.org/docs/messages/link-multiple-children` +
        (typeof window !== 'undefined'
          ? " \nOpen your browser's console to view the Component stack trace."
          : '')
      )
    }
  } else {
    child = React.Children.only(children)
  }
  const childRef: any = child && typeof child === 'object' && child.ref

  const [setIntersectionRef, isVisible] = useIntersection({
    rootMargin: '200px',
  })
  const setRef = React.useCallback(
    (el: Element) => {
      setIntersectionRef(el)
      if (childRef) {
        if (typeof childRef === 'function') childRef(el)
        else if (typeof childRef === 'object') {
          childRef.current = el
        }
      }
    },
    [childRef, setIntersectionRef]
  )
  // WOC
  const queryClient = useQueryClient()
  const session = useSession().data
  React.useEffect(() => {
    const shouldPrefetch = isVisible && p && isLocalURL(href)
    const curLocale =
      typeof locale !== 'undefined' ? locale : router && router.locale
    const isPrefetched =
      prefetched[href + '%' + as + (curLocale ? '%' + curLocale : '')]
    if (shouldPrefetch && !isPrefetched) {
      prefetch(router, href, as, { queryClient, session }, {
        locale: curLocale,
      })
    }
  }, [as, href, isVisible, locale, p, router, queryClient, session])

  const childProps: {
    onMouseEnter?: React.MouseEventHandler
    onClick: React.MouseEventHandler
    href?: string
    ref?: any
  } = {
    ref: setRef,
    onClick: (e: React.MouseEvent) => {
      if (child.props && typeof child.props.onClick === 'function') {
        child.props.onClick(e)
      }
      if (!e.defaultPrevented) {
        linkClicked(e, router, href, as, replace, shallow, scroll, locale)
      }
    },
  }

  childProps.onMouseEnter = (e: React.MouseEvent) => {
    if (child.props && typeof child.props.onMouseEnter === 'function') {
      child.props.onMouseEnter(e)
    }
    if (isLocalURL(href)) {
      prefetch(router, href, as, { queryClient, session }, { priority: true })
    }
  }

  // If child is an <a> tag and doesn't have a href attribute, or if the 'passHref' property is
  // defined, we specify the current 'href', so that repetition is not needed by the user
  if (props.passHref || (child.type === 'a' && !('href' in child.props))) {
    const curLocale =
      typeof locale !== 'undefined' ? locale : router && router.locale

    // we only render domain locales if we are currently on a domain locale
    // so that locale links are still visitable in development/preview envs
    const localeDomain =
      router &&
      router.isLocaleDomain &&
      getDomainLocale(
        as,
        curLocale,
        router && router.locales,
        router && router.domainLocales
      )

    childProps.href =
      localeDomain ||
      addBasePath(addLocale(as, curLocale, router && router.defaultLocale))
  }

  return React.cloneElement(child, childProps)
}