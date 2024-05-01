/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Redirect http://site.com/* to https://www.site.com/*
      {
        source: 'http://zanaathan.com/:path*',
        destination: 'https://zanaathan.com/:path*',
        permanent: true,
      },
      // Redirect https://site.com/* to https://www.site.com/*
      {
        source: 'http://www.zanaathan.com/:path*',
        destination: 'https://zanaathan.com/:path*',
        permanent: true,
      },
      // Redirect https://www.site.com/* to https://www.site.com/*
      // This ensures www vs non-www consistency
      {
        source: 'https://www.zanaathan.com/:path*',
        destination: 'https://zanaathan.com/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
