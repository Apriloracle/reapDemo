const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Forces Next.js to rebuild this broken ESM package
  transpilePackages: ['@crayonai/react-ui'],

  // Makes Node's strict ESM resolver not crash on directory imports
  experimental: {
    esmExternals: 'loose',
  },

  webpack: (config, { isServer }) => {
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:path': 'path-browserify',
      'node:crypto': 'crypto-browserify',
      'node:stream': 'stream-browserify',
      'node:buffer': 'buffer',
      // Add path alias for src directory
      '@': path.resolve(__dirname, 'src'),
      '@/services': path.resolve(__dirname, 'src/services'),
    };

    config.resolve.fallback = {
      ...config.resolve.fallback,
      ws: false,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer/'),
    };

    return config;
  },
};

module.exports = nextConfig;
