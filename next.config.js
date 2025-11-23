/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Forces Next.js to rebuild this broken ESM package
  transpilePackages: ['@crayonai/react-ui'],

  // Makes Node's strict ESM resolver not crash on directory imports
  experimental: {
    esmExternals: 'loose',
  },

  webpack: (config) => {
    // Your existing ws fallback
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
    };

    return config;
  },
};

module.exports = nextConfig;
