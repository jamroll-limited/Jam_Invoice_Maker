import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },

  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ['motion'],

  // 1. Added empty turbopack config to silence the Next.js 16 build error
  turbopack: {},

  webpack: (config, { dev }) => {
    // Preserve the existing HMR behavior.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }

    return config;
  },
};

export default nextConfig;