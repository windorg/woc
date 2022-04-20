import type { NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { boardsRoute } from 'lib/routes'

const Index: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>WOC</title>
        <meta httpEquiv="refresh" content={`0; URL='${boardsRoute()}'`} />
      </Head>
    </>
  )
}

export default Index
