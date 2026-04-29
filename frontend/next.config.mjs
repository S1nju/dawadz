/** @type {import('next').NextConfig} */
const isCapacitorBuild = process.env.CAPACITOR === 'true'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: isCapacitorBuild ? 'export' : 'standalone',
  async rewrites() {
    if (isCapacitorBuild) {
      return []
    }

    return [
      {
        source: '/proxy-api/:path*',
        destination: 'http://localhost:8001/api/:path*',
      },
      {
        source: '/proxy-reverb/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ]
  },
}

export default nextConfig
