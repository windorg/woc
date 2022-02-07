import Head from "next/head"

export function SocialTags(props: { title: string, description?: string }) {
  return (
    <Head>
      <meta property="og:title" content={props.title} />
      {props.description && <meta property="og:description" content={props.description} />}

      <meta property="twitter:card" content="summary" />
      <meta property="twitter:title" content={props.title} />
      {props.description && <meta property="twitter:description" content={props.description} />}
    </Head>
  )
}
