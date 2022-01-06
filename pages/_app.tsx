import '../styles/globals.scss'
import 'bootstrap/dist/css/bootstrap.css'
import type { AppContext } from 'next/app'
import App from 'next/app'
import Layout from '../components/layout'
import { getSession, SessionProvider } from "next-auth/react"
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import SSRProvider from 'react-bootstrap/SSRProvider'
import { SWRConfig } from 'swr'

TimeAgo.setDefaultLocale(en.locale)
TimeAgo.addLocale(en)

function MyApp({ Component, pageProps, session }) {
  return (
    <SSRProvider>
      <SessionProvider session={session}>
        <SWRConfig
          value={{
            refreshInterval: 3000,
            fetcher: async (resource, init) => fetch(resource, init).then(async res => res.json())
          }}
        >
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </SWRConfig>
      </SessionProvider>
    </SSRProvider>
  )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const session = await getSession({ req: appContext.ctx.req })
  const appProps = await App.getInitialProps(appContext)
  return { ...appProps, session }
}

export default MyApp
