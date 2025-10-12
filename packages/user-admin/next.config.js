/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize production builds
  reactStrictMode: true,
  
  // Enable SWC minification
  swcMinify: true,
  
  // Experimental features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:4300'],
    },
  },
  
  // Configure images
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
