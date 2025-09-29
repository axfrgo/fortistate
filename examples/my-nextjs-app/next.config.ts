import type { NextConfig } from "next";

const inspectorAllowed = process.env.FORTISTATE_INSPECTOR_ALLOWED_ORIGINS || 'http://192.168.2.83:4000'
const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
  },
  // allow inspector dev origin(s) to fetch Next's dev resources
  // set FORTISTATE_INSPECTOR_ALLOWED_ORIGINS to a comma-separated list if needed
  allowedDevOrigins: inspectorAllowed.split(',').map(s => s.trim()).filter(Boolean),
};

export default nextConfig;
