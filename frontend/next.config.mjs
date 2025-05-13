/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [], // Add any image domains you're loading from
  },
  // Performance optimizations
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Add any additional configurations from your original project
  // Such as environment variables, redirects, or rewrites
};

export default nextConfig;