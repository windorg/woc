import '../styles/globals.scss'
import 'bootstrap/dist/css/bootstrap.css'
import type { AppProps } from 'next/app'
import Layout from '../components/layout'
import { SessionProvider } from "next-auth/react"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import SSRProvider from 'react-bootstrap/SSRProvider'

TimeAgo.setDefaultLocale(en.locale)
TimeAgo.addLocale(en)

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SSRProvider>
      <SessionProvider session={session}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SessionProvider>
    </SSRProvider>
  )
}

export default MyApp
