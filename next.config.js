/** @type {import('next').NextConfig} */

const { withSuperjson } = require('next-superjson')

module.exports = withSuperjson({
  reactStrictMode: true,
})
