import '../styles/globals.scss'
import 'bootstrap/dist/css/bootstrap.css'
import Layout from '../components/layout'
import { SessionProvider } from 'next-auth/react'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en.json'
import SSRProvider from 'react-bootstrap/SSRProvider'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import React from 'react'
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'
import { CurrentUserProvider } from '@components/currentUserContext'
// import * as tauriGlobalShortcut from '@tauri-apps/api/globalShortcut'
// import * as tauri from '@tauri-apps/api/tauri'

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  uri: `${process.env.NEXT_PUBLIC_APP_URL!}/api/graphql`,
  defaultOptions: {
    watchQuery: {
      // Use cached data, but always fetch new data in the background. When you navigate to a page, you'll see cached data first, then the page will update when the query completes.
      fetchPolicy: 'cache-and-network',
    },
  },
})

TimeAgo.setDefaultLocale(en.locale)
TimeAgo.addLocale(en)

// Enable some shortcuts in Tauri (not needed for now!)
// if (typeof window !== 'undefined') {
//   void tauriGlobalShortcut.register('CmdOrCtrl+[', async () => {
//     await tauri.invoke('navigate-back')
//   })
// }

function MyApp(props) {
  const [queryClient] = React.useState(() => new QueryClient())

  const { Component, pageProps } = props
  return (
    <SSRProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <ApolloProvider client={apolloClient}>
            <CurrentUserProvider>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </CurrentUserProvider>
          </ApolloProvider>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </SessionProvider>
    </SSRProvider>
  )
}

export default MyApp
