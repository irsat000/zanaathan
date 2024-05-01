/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.zanaathan.com',
          },
        ],
        permanent: true,
        destination: 'https://zanaathan.com/:path*',
      },
    ]
  }
}

module.exports = nextConfig
