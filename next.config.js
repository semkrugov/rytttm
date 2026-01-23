/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for pages that use client-side only features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig
