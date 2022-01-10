// This module allows page control through props returned in getInitialProps, similar to what 'getServerSideProps'
// implements.

import { NextPage, NextPageContext } from 'next'
import NextError from 'next/error'

// Similar to 'GetServerSidePropsResult'
export type WithControl<P> =
  | { props: P }
  | { notFound: true }

// Wrap the page with this
export function PageWithControl<P>(Page: NextPage<P, WithControl<P>>): NextPage<P, WithControl<P>> {
  if (typeof Page.getInitialProps !== 'function')
    throw new Error(`PageWithControl(${Page.displayName}): no getInitialProps found`)
  const Page_ = (props) => {
    if ('notFound' in props) return <NextError statusCode={404} />
    return <Page {...props.props} />
  }
  Page_.displayName = Page.displayName
  Page_.getInitialProps = async (context) => {
    const result = await Page.getInitialProps!(context)
    if ('notFound' in result && context.res) context.res.statusCode = 404
    return result
  }
  return Page_
}
