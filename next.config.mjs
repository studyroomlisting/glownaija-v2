/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip static generation errors for pages that require env vars at runtime
  // All pages are server-rendered at request time (not statically generated)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
}

export default nextConfig
