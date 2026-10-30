import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-XSS-Protection',            value: '1; mode=block' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Ancienne URL de la vue recruteur (avant /entreprise)
      {
        source: '/',
        has: [{ type: 'query', key: 'view', value: 'entreprise' }],
        destination: '/entreprise',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
