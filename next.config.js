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
}

module.exports = nextConfig