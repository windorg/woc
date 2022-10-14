/** @type {import('next').NextConfig} */

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const webpack = require('webpack')

// Embed NEXTAUTH_URL into the frontend — otherwise next-auth won't work. See https://github.com/nextauthjs/next-auth/issues/4434
const nextauthPlugin = new webpack.DefinePlugin({
  "process.env.NEXTAUTH_URL": JSON.stringify(process.env.NEXTAUTH_URL),
})

module.exports = {
  reactStrictMode: true,

  images: {
    // We don't use next/image because we want 'next export' to work, but we still
    // have to specify a loader or else 'next export' complains
    loader: 'imgix',
    path: '/',
  },

  webpack: (config, options) => {
    const { dev, isServer } = options
    // Do not run type checking twice:
    if (dev && isServer) {
      config.plugins.push(new ForkTsCheckerWebpackPlugin())
    }
    config.plugins.push(nextauthPlugin)
    return config
  },

  // Old /ShowBoard and /ShowCard pages
  async redirects() {
    return [
      {
        source: '/ShowBoard',
        has: [{type: 'query', key: 'boardId', value: '(?<boardId>[a-z0-9-]+)'}],
        permanent: true,
        destination: '/card?id=:boardId'
      },
      {
        source: '/ShowCard',
        has: [{type: 'query', key: 'cardId', value: '(?<cardId>[a-z0-9-]+)'}],
        permanent: true,
        destination: '/card?id=:cardId'
      },
    ]
  }
}
