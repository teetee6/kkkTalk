/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname:
          process.env.NODE_ENV === 'production'
            ? 'kkkkkktalk.com'
            : 'localhost',
      },
    ],
  },
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/www/:path*',
          destination: `https://kkkkkktalk.com/:path*`,
          permanent: true,
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
