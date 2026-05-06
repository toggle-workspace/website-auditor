/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['linkinator', 'sitemapper', 'cheerio', '@react-pdf/renderer'],
  },
};

export default nextConfig;
