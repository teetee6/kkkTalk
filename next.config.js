/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
};

module.exports = nextConfig;
