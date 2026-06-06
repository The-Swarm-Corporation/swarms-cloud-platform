/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Browsers request /favicon.ico directly without consulting <link rel="icon">,
  // so point that legacy URL at our SVG icon to silence the production 404.
  async redirects() {
    return [
      {
        source: '/favicon.ico',
        destination: '/swarms-logo.svg',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
