/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        port: '',
        pathname: '/a/**',
      },
      // Add other trusted image sources here
    ],
  },

  // API route configuration
  async headers() {
    return [
      {
        // API routes security headers
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.ALLOWED_ORIGINS || "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
          // Additional security headers
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ]
      }
    ]
  },

  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: [process.env.NEXTAUTH_URL || "localhost:3000"],
      allowedForwardedHosts: ["localhost"],
    },
  },

  // Logging configuration
  logging: {
    debug: process.env.NODE_ENV === 'development',
    development: process.env.NODE_ENV === 'development'
  },

  // Build configuration
  webpack: (config, { isServer }) => {
    // Add custom webpack configuration here
    return config
  },

  // Environment configuration
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL,
  },

  // Security configurations
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig; 