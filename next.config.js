/** @type {import('next').NextConfig} */

const nextConfig = {
  // Skip validation for environment variables during build
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Experimental feature to help with build-time issues
  experimental: {
    esmExternals: true,
  },
};

module.exports = nextConfig;