import '../styles/globals.scss'
import 'bootstrap/dist/css/bootstrap.css'
import type { AppContext } from 'next/app'
import App from 'next/app'
import Layout from '../components/layout'
import { getSession, SessionProvider } from "next-auth/react"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import SSRProvider from 'react-bootstrap/SSRProvider'
import { Session } from 'next-auth'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import React from 'react'
import { isNextExport } from '../lib/export'

TimeAgo.setDefaultLocale(en.locale)
TimeAgo.addLocale(en)

function MyApp(props) {
  const [queryClient] = React.useState(() => new QueryClient())

  const { Component, pageProps } = props
  return (
    <SSRProvider>
      {/* If props.session isn't provided, MyApp is being rendered client-side. In this case
          we make sure to not provide any session at all so that the session cache maintained
          by the SessionProvider would be reused. */}
      <SessionProvider {...(props.session !== undefined) ? { session: props.session } : {}}>
        <QueryClientProvider client={queryClient}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </SessionProvider>
    </SSRProvider>
  )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  let session: Session | null | undefined = undefined
  // getSession works both server-side and client-side but we want to avoid any calls to /api/auth/session
  // on page navigation, so we only call it server-side. We also can't call 'getSession' during 'next export'.
  if (typeof window === 'undefined') {
    if (!isNextExport(appContext.ctx)) session = await getSession(appContext.ctx)
  }
  const appProps = await App.getInitialProps(appContext)
  return { ...appProps, ...((session !== undefined) ? { session } : {}) }
}

export default MyApp