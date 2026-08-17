/** @type {import('next').NextConfig} */

const nextConfig = {
  // NOTE: DATABASE_URL is deliberately NOT listed under `env`. Next inlines those
  // values at build time into any bundle that references them, including client
  // bundles - one stray import would have published the database credentials in
  // a public JavaScript file. Server code reads process.env directly at runtime.
  experimental: {
    esmExternals: true,
  },
  // Disable static page optimization for API routes
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;
