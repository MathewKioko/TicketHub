/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    serverComponentsExternalPackages: ['@react-pdf/renderer', 'resend'],
  },
}

module.exports = nextConfig

