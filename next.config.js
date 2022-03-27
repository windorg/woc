/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  images: {
    // We don't use next/image because we want 'next export' to work, but we still
    // have to specify a loader or else 'next export' complains
    loader: 'imgix',
    path: '/',
  }
}
