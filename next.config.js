/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Prisma warnings during build
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
