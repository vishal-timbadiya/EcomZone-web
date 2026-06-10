/** @type {import('next').NextConfig} */

const nextConfig = {
  // Ensure environment variables are available
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Enable experimental features for better build performance
  experimental: {
    esmExternals: true,
  },
  // Disable static page optimization for API routes
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;