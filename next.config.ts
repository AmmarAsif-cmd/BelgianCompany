import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // Avoid picking a parent-folder lockfile (e.g. C:\Users\User) as the app root.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

export default nextConfig
