import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import React from 'react'
import { getSession } from 'next-auth/react'
import _ from 'lodash'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const include = { owner: { select: { handle: true, displayName: true } } }
  const session = await getSession(context)
  if (session) {
    return { redirect: { permanent: false, destination: '/Boards' } }
  } else {
    return { props: {} }
  }
}

const Index: NextPage = (props) => {
  return (
    <>
      <Head>
        <title>WOC</title>
      </Head>
    </>
  )
}

export default Index
