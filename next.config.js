/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict type checking
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    // Enable strict ESLint checking
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Fix for Konva.js in Next.js - handle both server and client
    if (isServer) {
      // On server, completely ignore konva and canvas
      config.externals = [...(config.externals || []), 'konva', 'canvas'];
    } else {
      // On client, use canvas fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig